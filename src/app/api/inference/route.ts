import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { inferenceRequestSchema } from "@/types/inference";
import { requireAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { uploadMediaToR2, getPresignedUrls } from "@/lib/r2";
import {
  normalizeOutput,
  extractMediaUrls,
  outputTypeForTask,
} from "@/lib/inference-utils";
import {
  buildPaymentRequirementsResponse,
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
import { eq } from "drizzle-orm";
import { foundry } from "viem/chains";

const EXPOSE_HEADERS = "Payment-Required, Payment-Response";
const isLocalDevChain = (id: number) => id === foundry.id;

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
    const estimated = estimateCostUsdc(task, ratePerSec);
    const amountOnChain = usdcToOnChainAmount(estimated);

    const paymentRequirements = buildPaymentRequirementsResponse(
      chainId,
      amountOnChain,
      "/api/inference"
    );

    const paymentRequiredHeader = encodePaymentHeader(paymentRequirements);

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

  // Rebuild the payment requirement for verification
  const estimated = estimateCostUsdc(task, ratePerSec);
  const amountOnChain = usdcToOnChainAmount(estimated);
  const paymentRequirements = buildPaymentRequirementsResponse(
    chainId,
    amountOnChain,
    "/api/inference"
  );
  const paymentRequirement = paymentRequirements.paymentRequirements[0];

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
    console.log("[dev] Skipping x402 facilitator settle for local chain");
  } else {
    try {
      settlementResponse = await settleWithFacilitator(paymentPayload, paymentRequirement);
      settlementTxHash = settlementResponse.transaction;
    } catch (settleErr) {
      const settleMessage = settleErr instanceof Error ? settleErr.message : "Settlement failed";
      return NextResponse.json(
        { error: settleMessage, code: "SETTLEMENT_FAILED" },
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
          const uploadMessage = uploadErr instanceof Error ? uploadErr.message : "Unknown upload error";
          try {
            await db
              .update(inferences)
              .set({ status: "failed", errorMessage: uploadMessage })
              .where(eq(inferences.id, record.id));
          } catch {
            // DB update failed — don't mask the original error
          }
          return NextResponse.json(
            { error: uploadMessage, code: "INFERENCE_ERROR" },
            { status: 502 }
          );
        }

        await db
          .update(inferences)
          .set({ r2Keys, status: "succeeded" })
          .where(eq(inferences.id, record.id));

        const presignedUrls = await getPresignedUrls(r2Keys);
        responseOutput = presignedUrls.length === 1 ? presignedUrls[0] : presignedUrls;

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
    const message = err instanceof Error ? err.message : "Unknown error";
    const isModelNotFound =
      message.includes("404") &&
      (message.includes("could not be found") || message.includes("Not Found"));

    const errorCode = isModelNotFound ? "MODEL_NOT_FOUND" : "INFERENCE_ERROR";
    const errorMessage = isModelNotFound
      ? `Model "${model}" is no longer available on Replicate. Please select a different model.`
      : message;
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
        errorMessage: errorMessage,
        estimatedCostUsdc: estimatedCost,
        paymentTxHash: settlementTxHash ?? null,
        paymentChainId: chainId,
      });
    } catch {
      // DB insert failed — don't mask the original error
    }

    return NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: httpStatus }
    );
  }
}
