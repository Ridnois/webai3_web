import { z } from "zod";

export const taskTypeSchema = z.enum([
  "text-to-image",
  "text-to-text",
  "text-to-sound",
]);
export type TaskType = z.infer<typeof taskTypeSchema>;

export const replicateModelSchema = z.object({
  owner: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  runCount: z.number(),
  url: z.string(),
});
export type ReplicateModel = z.infer<typeof replicateModelSchema>;

export const inferenceRequestSchema = z.object({
  model: z
    .string()
    .min(1, "Model is required")
    .regex(
      /^[a-z0-9_-]+\/[a-z0-9._-]+(:[a-z0-9]+)?$/i,
      "Model must be in owner/name or owner/name:version format"
    ),
  task: taskTypeSchema,
  input: z.record(z.unknown()),
});
export type InferenceRequest = z.infer<typeof inferenceRequestSchema>;

export const inferenceResponseSchema = z.object({
  id: z.string().uuid().optional(),
  output: z.unknown(),
  status: z.string(),
  metrics: z
    .object({
      predictTimeMs: z.number().optional(),
      estimatedCostUsdc: z.number().optional(),
      actualCostUsdc: z.number().optional(),
    })
    .optional(),
  error: z.string().optional(),
});
export type InferenceResponse = z.infer<typeof inferenceResponseSchema>;
