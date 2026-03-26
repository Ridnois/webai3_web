import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { inferenceRequestSchema } from "@/types/inference";
import type { TaskType } from "@/types/inference";
import { TASK_CONFIGS } from "@/types/task-config";
import { requireAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { freeInferenceGrants, inferences } from "@/lib/db/schema";
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

  return TASK_CONFIGS[task].estimatedSeconds;
}

/** Strip internal paths, stack traces, and tokens from error messages before sending to client. */
function sanitizeErrorReason(raw: string): string {
  let cleaned = raw.split("\n")[0].trim();
  cleaned = cleaned.replace(/^(Prediction failed: |Error: )/, "");
  if (cleaned.length > 300) cleaned = cleaned.slice(0, 300) + "…";
  return cleaned;
}

/** Encode a single SSE data line. */
function sseEvent(event: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
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

  const session = await getSession();
  const chainId = session.chainId ?? 11155111;
  const db = getDb();

  const [freeGrant] = await db
    .select()
    .from(freeInferenceGrants)
    .where(eq(freeInferenceGrants.address, auth.address));

  const hasFreeCredit =
    freeGrant && freeGrant.usedCount < freeGrant.creditAmount;

  const paymentSignatureHeader = request.headers.get("Payment-Signature");
  const shouldUseFreeCredit = Boolean(hasFreeCredit);

  // ─── Phase 1: No payment header → return 402 ───────────────────────────

  if (!paymentSignatureHeader && !shouldUseFreeCredit) {
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

  // ─── Phase 2: Has payment header → SSE stream ──────────────────────────

  let paymentPayload = null;
  if (paymentSignatureHeader && !shouldUseFreeCredit) {
    try {
      paymentPayload = decodePaymentHeader(paymentSignatureHeader, paymentPayloadSchema);
    } catch {
      return NextResponse.json(
        { error: "Invalid Payment-Signature header", code: "PAYMENT_INVALID" },
        { status: 400 }
      );
    }
  }

  const estimated = estimateCostUsdc(task, ratePerSec);
  const outputType = outputTypeForTask(task);
  const estimatedCost = estimated.toString();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const isFreeInference = shouldUseFreeCredit;
        let settlementTxHash: string | undefined;
        let settlementResponse;
        const paymentRequirement = paymentPayload?.accepted;

        if (!isFreeInference) {
          // ── Verify ────────────────────────────────────────────────────
          if (!isLocalDevChain(chainId)) {
            controller.enqueue(sseEvent({ phase: "verifying" }));
            const verifyResult = await verifyWithFacilitator(paymentPayload!, paymentRequirement!);
            if (!verifyResult.isValid) {
              controller.enqueue(sseEvent({
                phase: "error",
                error: `Payment verification failed: ${verifyResult.invalidReason ?? "unknown"}`,
                code: "PAYMENT_INVALID",
              }));
              controller.close();
              return;
            }
          }

          // ── Settle ────────────────────────────────────────────────────
          controller.enqueue(sseEvent({ phase: "settling" }));

          if (isLocalDevChain(chainId)) {
            settlementTxHash = `0x${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
          } else {
            try {
              settlementResponse = await settleWithFacilitator(paymentPayload!, paymentRequirement!);
              settlementTxHash = settlementResponse.transaction || undefined;
            } catch (settleErr) {
              const settleRaw = settleErr instanceof Error ? settleErr.message : "Settlement failed";
              console.error("[api/inference] Settlement error:", settleRaw);
              controller.enqueue(sseEvent({
                phase: "error",
                error: "Payment settlement failed. Please try again.",
                code: "SETTLEMENT_FAILED",
              }));
              controller.close();
              return;
            }

            // Defensive: never proceed without a confirmed settlement tx
            if (!settlementTxHash) {
              console.error("[api/inference] Settlement returned no tx hash");
              controller.enqueue(sseEvent({
                phase: "error",
                error: "Payment settlement failed. No transaction confirmed.",
                code: "SETTLEMENT_FAILED",
              }));
              controller.close();
              return;
            }
          }
        }

        // ── Run inference ────────────────────────────────────────────────
        controller.enqueue(sseEvent({ phase: "running", txHash: settlementTxHash }));

        const replicate = getReplicateClient();
        const identifier = model as `${string}/${string}`;
        const startTime = Date.now();

        let rawOutput: unknown;
        try {
          rawOutput = await replicate.run(identifier, { input });
        } catch (err) {
          const rawMessage = err instanceof Error ? err.message : "Unknown error";
          const isModelNotFound =
            rawMessage.includes("404") &&
            (rawMessage.includes("could not be found") || rawMessage.includes("Not Found"));

          console.error("[api/inference] Inference error:", rawMessage);

          try {
            const failureCostFields = {
              estimatedCostUsdc: isFreeInference ? "0" : estimatedCost,
              paymentTxHash: isFreeInference ? null : settlementTxHash ?? null,
              paymentChainId: isFreeInference ? null : chainId,
              isFreeInference: isFreeInference ? 1 : 0,
            };
            await db.insert(inferences).values({
              userAddress: auth.address,
              taskType: task,
              model,
              input,
              outputType,
              status: "failed",
              errorMessage: rawMessage,
              ...failureCostFields,
            });
          } catch { /* don't mask original error */ }

          controller.enqueue(sseEvent({
            phase: "error",
            error: isModelNotFound
              ? `Model "${model}" is no longer available on Replicate. Please select a different model.`
              : "Inference failed. Please try again later.",
            code: isModelNotFound ? "MODEL_NOT_FOUND" : "INFERENCE_ERROR",
          }));
          controller.close();
          return;
        }

        const predictTimeMs = Date.now() - startTime;
        const output = normalizeOutput(rawOutput);
        const actualCost = isFreeInference ? 0 : actualCostUsdc(predictTimeMs, ratePerSec);
        const actualCostStr = isFreeInference ? "0" : actualCost.toString();

        const costFields = {
          estimatedCostUsdc: isFreeInference ? "0" : estimatedCost,
          actualCostUsdc: actualCostStr,
          paymentTxHash: isFreeInference ? null : settlementTxHash ?? null,
          paymentChainId: isFreeInference ? null : chainId,
          isFreeInference: isFreeInference ? 1 : 0,
        };

        const costMetrics = {
          predictTimeMs,
          estimatedCostUsdc: isFreeInference ? 0 : parseFloat(estimatedCost),
          actualCostUsdc: isFreeInference ? 0 : actualCost,
        };

        const settlementBase64 = settlementResponse
          ? encodePaymentHeader(settlementResponse)
          : null;

        // ── Persist & respond ────────────────────────────────────────────
        if (outputType !== "text") {
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

            let r2Keys: string[];
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
              } catch { /* don't mask */ }
              controller.enqueue(sseEvent({
                phase: "error",
                error: "Failed to process media output. Please try again.",
                code: "INFERENCE_ERROR",
              }));
              controller.close();
              return;
            }

            await db
              .update(inferences)
              .set({ r2Keys, status: "succeeded" })
              .where(eq(inferences.id, record.id));

            if (isFreeInference && freeGrant) {
              await db
                .update(freeInferenceGrants)
                .set({ usedCount: freeGrant.usedCount + 1 })
                .where(eq(freeInferenceGrants.id, freeGrant.id));
            }

            const publicUrls = getPublicUrls(r2Keys);
            const responseOutput = publicUrls.length === 1 ? publicUrls[0] : publicUrls;

            controller.enqueue(sseEvent({
              phase: "done",
              result: { id: record.id, output: responseOutput, status: "succeeded", metrics: costMetrics },
              settlementBase64,
            }));
            controller.close();
            return;
          }
        }

        // Text output or no media URLs
        const [record] = await db
          .insert(inferences)
          .values({
            userAddress: auth.address,
            taskType: task,
            model,
            input,
            outputType,
            outputData: output,
            r2Keys: null,
            status: "succeeded",
            predictTimeMs,
            ...costFields,
          })
          .returning({ id: inferences.id });

        if (isFreeInference && freeGrant) {
          await db
            .update(freeInferenceGrants)
            .set({ usedCount: freeGrant.usedCount + 1 })
            .where(eq(freeInferenceGrants.id, freeGrant.id));
        }

        controller.enqueue(sseEvent({
          phase: "done",
          result: { id: record.id, output, status: "succeeded", metrics: costMetrics },
          settlementBase64,
        }));
        controller.close();

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[api/inference] Stream error:", msg);
        try {
          controller.enqueue(sseEvent({
            phase: "error",
            error: sanitizeErrorReason(msg),
            code: "INTERNAL_ERROR",
          }));
          controller.close();
        } catch { /* stream already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Expose-Headers": EXPOSE_HEADERS,
    },
  });
}
