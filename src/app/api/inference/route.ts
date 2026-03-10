import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { inferenceRequestSchema } from "@/types/inference";
import type { TaskType } from "@/types/inference";
import { TASK_CONFIGS } from "@/types/task-config";
import { requireAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { uploadMediaToR2, getPublicUrls } from "@/lib/r2";
import {
  normalizeOutput,
  extractMediaUrls,
  outputTypeForTask,
} from "@/lib/inference-utils";
import {
  buildPaymentRequiredResponse,
  encodePaymentHeader,
  decodePaymentHeader,
  paymentPayloadSchema,
  verifyWithFacilitator,
  settleWithFacilitator,
} from "@/lib/x402";
import {
  estimateCostUsdc,
  actualCostUsdc,
  usdcToOnChainAmount,
} from "@/lib/pricing";
import { getServerEnv } from "@/lib/server-env";
import { eq, and, avg } from "drizzle-orm";
import { foundry } from "viem/chains";

const EXPOSE_HEADERS = "Payment-Required, Payment-Response";
const isLocalDevChain = (id: number) => id === foundry.id;

/** Look up historical avg predict time for a model (or task fallback), return estimated seconds. */
async function historicalEstimateSeconds(
  db: ReturnType<typeof getDb>,
  model: string,
  task: TaskType,
): Promise<number> {
  // Try model-specific average first
  const [modelResult] = await db
    .select({ avgMs: avg(inferences.predictTimeMs) })
    .from(inferences)
    .where(
      and(
        eq(inferences.model, model),
        eq(inferences.status, "succeeded"),
      ),
    );

  if (modelResult?.avgMs != null) {
    return parseFloat(modelResult.avgMs) / 1000;
  }

  // Fall back to task-wide average
  const [taskResult] = await db
    .select({ avgMs: avg(inferences.predictTimeMs) })
    .from(inferences)
    .where(
      and(
        eq(inferences.taskType, task),
        eq(inferences.status, "succeeded"),
      ),
    );

  if (taskResult?.avgMs != null) {
    return parseFloat(taskResult.avgMs) / 1000;
  }

  // Fall back to static default
  return TASK_CONFIGS[task].estimatedSeconds;
}

/** Strip internal paths, stack traces, and tokens from error messages before sending to client. */
function sanitizeErrorReason(raw: string): string {
  // Remove file paths, stack traces, and anything after a newline
  let cleaned = raw.split("\n")[0].trim();
  // Strip common prefixes from Replicate errors
  cleaned = cleaned.replace(/^(Prediction failed: |Error: )/, "");
  // Cap length
  if (cleaned.length > 300) cleaned = cleaned.slice(0, 300) + "…";
  return cleaned;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const parsed = inferenceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { model, task, input } = parsed.data;
  const env = getServerEnv();
  const ratePerSec = parseFloat(env.INFERENCE_RATE_PER_SEC);

  // Determine chain from session, default to Base Sepolia
  const session = await getSession();
  const chainId = session.chainId ?? 84532;

  const paymentSignatureHeader = request.headers.get("Payment-Signature");

  // ─── Phase 1: No payment header → return 402 ───────────────────────────

  if (!paymentSignatureHeader) {
    const db = getDb();
    const estSeconds = await historicalEstimateSeconds(db, model, task);
    const estimated = estimateCostUsdc(task, ratePerSec, estSeconds);
    const amountOnChain = usdcToOnChainAmount(estimated);

    const paymentRequired = buildPaymentRequiredResponse(
      chainId,
      amountOnChain,
      "/api/inference"
    );

    const paymentRequiredHeader = encodePaymentHeader(paymentRequired);

    return new NextResponse(
      JSON.stringify({
        error: "Payment required",
        code: "PAYMENT_REQUIRED",
        estimatedCostUsdc: estimated,
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Payment-Required": paymentRequiredHeader,
          "Access-Control-Expose-Headers": EXPOSE_HEADERS,
        },
      }
    );
  }

  // ─── Phase 2: Has payment header → verify, run, settle ─────────────────

  let paymentPayload;
  try {
    paymentPayload = decodePaymentHeader(paymentSignatureHeader, paymentPayloadSchema);
  } catch {
    return NextResponse.json(
      { error: "Invalid Payment-Signature header", code: "PAYMENT_INVALID" },
      { status: 400 }
    );
  }

  // The accepted requirement is embedded in the payment payload (x402 v2)
  const paymentRequirement = paymentPayload.accepted;
  const estimated = estimateCostUsdc(task, ratePerSec);

  // Verify with facilitator (skip on local dev chain — facilitator doesn't support Anvil)
  if (!isLocalDevChain(chainId)) {
    const verifyResult = await verifyWithFacilitator(paymentPayload, paymentRequirement);
    if (!verifyResult.isValid) {
      return new NextResponse(
        JSON.stringify({
          error: `Payment verification failed: ${verifyResult.invalidReason ?? "unknown"}`,
          code: "PAYMENT_INVALID",
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Expose-Headers": EXPOSE_HEADERS,
          },
        }
      );
    }
  }

  // Settle payment before running inference
  const db = getDb();
  const outputType = outputTypeForTask(task);
  const estimatedCost = estimated.toString();

  let settlementTxHash: string | undefined;
  let settlementResponse;
  if (isLocalDevChain(chainId)) {
    settlementTxHash = `0x${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  } else {
    try {
      settlementResponse = await settleWithFacilitator(paymentPayload, paymentRequirement);
      settlementTxHash = settlementResponse.transaction || undefined;
    } catch (settleErr) {
      const settleRaw = settleErr instanceof Error ? settleErr.message : "Settlement failed";
      console.error("[api/inference] Settlement error:", settleRaw);
      return NextResponse.json(
        { error: "Payment settlement failed. Please try again.", code: "SETTLEMENT_FAILED" },
        { status: 402 }
      );
    }
  }

  // Run inference (payment already settled)
  try {
    const replicate = getReplicateClient();
    const identifier = model as `${string}/${string}`;
    const startTime = Date.now();

    const rawOutput = await replicate.run(identifier, { input });
    const predictTimeMs = Date.now() - startTime;
    const output = normalizeOutput(rawOutput);
    console.log("[api/inference] Raw output type:", typeof rawOutput, Array.isArray(rawOutput) ? `array[${rawOutput.length}]` : "");
    console.log("[api/inference] Normalized output:", JSON.stringify(output)?.slice(0, 500));
    const actualCost = actualCostUsdc(predictTimeMs, ratePerSec);
    const actualCostStr = actualCost.toString();

    const costFields = {
      estimatedCostUsdc: estimatedCost,
      actualCostUsdc: actualCostStr,
      paymentTxHash: settlementTxHash ?? null,
      paymentChainId: chainId,
    };

    const costMetrics = {
      predictTimeMs,
      estimatedCostUsdc: parseFloat(estimatedCost),
      actualCostUsdc: actualCost,
    };

    let r2Keys: string[] | null = null;
    let outputData: unknown = null;
    let responseOutput: unknown = output;

    if (outputType === "text") {
      outputData = output;
    } else {
      // Media output — upload to R2
      const mediaUrls = extractMediaUrls(output);
      console.log("[api/inference] Extracted media URLs:", mediaUrls);
      if (mediaUrls.length > 0) {
        const [record] = await db
          .insert(inferences)
          .values({
            userAddress: auth.address,
            taskType: task,
            model,
            input,
            outputType,
            status: "pending",
            predictTimeMs,
            ...costFields,
          })
          .returning({ id: inferences.id });

        try {
          r2Keys = await Promise.all(
            mediaUrls.map((url, i) =>
              uploadMediaToR2(url, auth.address, record.id, i)
            )
          );
        } catch (uploadErr) {
          const uploadRaw = uploadErr instanceof Error ? uploadErr.message : "Unknown upload error";
          console.error("[api/inference] Upload error:", uploadRaw);
          try {
            await db
              .update(inferences)
              .set({ status: "failed", errorMessage: uploadRaw })
              .where(eq(inferences.id, record.id));
          } catch {
            // DB update failed — don't mask the original error
          }
          return NextResponse.json(
            { error: "Failed to process media output. Please try again.", code: "INFERENCE_ERROR", reason: sanitizeErrorReason(uploadRaw) },
            { status: 502 }
          );
        }

        await db
          .update(inferences)
          .set({ r2Keys, status: "succeeded" })
          .where(eq(inferences.id, record.id));

        const publicUrls = getPublicUrls(r2Keys);
        responseOutput = publicUrls.length === 1 ? publicUrls[0] : publicUrls;

        const responseBody = JSON.stringify({
          id: record.id,
          output: responseOutput,
          status: "succeeded",
          metrics: costMetrics,
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Access-Control-Expose-Headers": EXPOSE_HEADERS,
        };
        if (settlementResponse) {
          headers["Payment-Response"] = encodePaymentHeader(settlementResponse);
        }

        return new NextResponse(responseBody, { status: 200, headers });
      }
    }

    // Text output or no media URLs found — insert directly
    const [record] = await db
      .insert(inferences)
      .values({
        userAddress: auth.address,
        taskType: task,
        model,
        input,
        outputType,
        outputData,
        r2Keys,
        status: "succeeded",
        predictTimeMs,
        ...costFields,
      })
      .returning({ id: inferences.id });

    const responseBody = JSON.stringify({
      id: record.id,
      output: responseOutput,
      status: "succeeded",
      metrics: costMetrics,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Expose-Headers": EXPOSE_HEADERS,
    };
    if (settlementResponse) {
      headers["Payment-Response"] = encodePaymentHeader(settlementResponse);
    }

    return new NextResponse(responseBody, { status: 200, headers });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Unknown error";
    const isModelNotFound =
      rawMessage.includes("404") &&
      (rawMessage.includes("could not be found") || rawMessage.includes("Not Found"));

    const errorCode = isModelNotFound ? "MODEL_NOT_FOUND" : "INFERENCE_ERROR";
    const errorMessage = isModelNotFound
      ? `Model "${model}" is no longer available on Replicate. Please select a different model.`
      : "Inference failed. Please try again later.";

    console.error("[api/inference] Inference error:", rawMessage);
    const httpStatus = isModelNotFound ? 404 : 502;

    // Best-effort: persist the failure (payment was already settled)
    try {
      await db.insert(inferences).values({
        userAddress: auth.address,
        taskType: task,
        model,
        input,
        outputType,
        status: "failed",
        errorMessage: rawMessage,
        estimatedCostUsdc: estimatedCost,
        paymentTxHash: settlementTxHash ?? null,
        paymentChainId: chainId,
      });
    } catch {
      // DB insert failed — don't mask the original error
    }

    return NextResponse.json(
      { error: errorMessage, code: errorCode, reason: sanitizeErrorReason(rawMessage) },
      { status: httpStatus }
    );
  }
}
