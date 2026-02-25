import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import { inferenceRequestSchema } from "@/types/inference";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { inferences } from "@/lib/db/schema";
import { uploadMediaToR2, getPresignedUrls } from "@/lib/r2";
import type { TaskType } from "@/types/inference";

function isFileOutput(value: unknown): value is { url(): URL } {
  return (
    value !== null &&
    typeof value === "object" &&
    "url" in value &&
    typeof (value as Record<string, unknown>).url === "function"
  );
}

function normalizeOutput(output: unknown): unknown {
  if (isFileOutput(output)) {
    return output.url().href;
  }
  if (Array.isArray(output)) {
    return output.map(normalizeOutput);
  }
  return output;
}

function extractMediaUrls(output: unknown): string[] {
  const urls: string[] = [];

  function walk(val: unknown) {
    if (typeof val === "string" && val.startsWith("https://")) {
      urls.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    }
  }

  walk(output);
  return urls;
}

function outputTypeForTask(task: TaskType): "text" | "image" | "audio" {
  switch (task) {
    case "text-to-image":
      return "image";
    case "text-to-sound":
      return "audio";
    default:
      return "text";
  }
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
  const db = getDb();
  const outputType = outputTypeForTask(task);

  try {
    const replicate = getReplicateClient();
    const identifier = model as `${string}/${string}`;
    const startTime = Date.now();

    const rawOutput = await replicate.run(identifier, { input });
    const predictTimeMs = Date.now() - startTime;
    const output = normalizeOutput(rawOutput);

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
          })
          .returning({ id: inferences.id });

        r2Keys = await Promise.all(
          mediaUrls.map((url, i) =>
            uploadMediaToR2(url, auth.address, record.id, i)
          )
        );

        // Update with final data
        const { eq } = await import("drizzle-orm");
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
          metrics: { predictTimeMs },
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
      })
      .returning({ id: inferences.id });

    return NextResponse.json({
      id: record.id,
      output: responseOutput,
      status: "succeeded",
      metrics: { predictTimeMs },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Best-effort: persist the failure
    try {
      await db.insert(inferences).values({
        userAddress: auth.address,
        taskType: task,
        model,
        input,
        outputType,
        status: "failed",
        errorMessage: message,
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
