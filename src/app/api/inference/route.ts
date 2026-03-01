import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { inferenceRequestSchema } from "@/types/inference";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { uploadMediaToR2, getPresignedUrls } from "@/lib/r2";
import {
  normalizeOutput,
  extractMediaUrls,
  outputTypeForTask,
} from "@/lib/inference-utils";
import { verifyPayment } from "@/lib/verify-payment";
import { actualCostUsdc, usdcToOnChainAmount } from "@/lib/pricing";
import { getServerEnv } from "@/lib/server-env";
import { eq } from "drizzle-orm";

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

  const { model, task, input, payment } = parsed.data;
  const db = getDb();
  const outputType = outputTypeForTask(task);
  const env = getServerEnv();
  const ratePerSec = parseFloat(env.INFERENCE_RATE_PER_SEC);

  // Verify payment on-chain
  const expectedAmountMin = usdcToOnChainAmount(payment.estimatedCostUsdc);
  const verifyResult = await verifyPayment({
    txHash: payment.txHash as `0x${string}`,
    chainId: payment.chainId,
    expectedFrom: auth.address,
    expectedAmountMin,
  });

  if (!verifyResult.valid) {
    return NextResponse.json(
      { error: `Payment verification failed: ${verifyResult.error}`, code: "PAYMENT_INVALID" },
      { status: 402 }
    );
  }

  // Check for duplicate txHash before running inference
  const [existingTx] = await db
    .select({ id: inferences.id })
    .from(inferences)
    .where(eq(inferences.paymentTxHash, payment.txHash));

  if (existingTx) {
    return NextResponse.json(
      { error: "Transaction already used for a previous inference", code: "DUPLICATE_PAYMENT" },
      { status: 409 }
    );
  }

  const estimatedCost = payment.estimatedCostUsdc.toString();
  const paymentTxHash = payment.txHash;
  const paymentChainId = payment.chainId;

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
      paymentTxHash,
      paymentChainId,
    };

    const costMetrics = {
      predictTimeMs,
      estimatedCostUsdc: estimatedCost ? parseFloat(estimatedCost) : undefined,
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
        // Insert pending record to get the ID
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
          // Update the existing pending record to failed (not insert a new one)
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

        // Update with final data
        await db
          .update(inferences)
          .set({ r2Keys, status: "succeeded" })
          .where(eq(inferences.id, record.id));

        const presignedUrls = await getPresignedUrls(r2Keys);
        responseOutput = presignedUrls.length === 1 ? presignedUrls[0] : presignedUrls;

        return NextResponse.json({
          id: record.id,
          output: responseOutput,
          status: "succeeded",
          metrics: costMetrics,
        });
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

    return NextResponse.json({
      id: record.id,
      output: responseOutput,
      status: "succeeded",
      metrics: costMetrics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Best-effort: persist the failure with payment data
    try {
      await db.insert(inferences).values({
        userAddress: auth.address,
        taskType: task,
        model,
        input,
        outputType,
        status: "failed",
        errorMessage: message,
        estimatedCostUsdc: estimatedCost,
        paymentTxHash,
        paymentChainId,
      });
    } catch {
      // DB insert failed — don't mask the original error
    }

    return NextResponse.json(
      { error: message, code: "INFERENCE_ERROR" },
      { status: 502 }
    );
  }
}
