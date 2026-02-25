import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const taskTypeEnum = pgEnum("task_type", [
  "text-to-image",
  "text-to-text",
  "text-to-sound",
]);

export const outputTypeEnum = pgEnum("output_type", [
  "text",
  "image",
  "audio",
]);

export const inferenceStatusEnum = pgEnum("inference_status", [
  "pending",
  "succeeded",
  "failed",
]);

export const users = pgTable("users", {
  address: text("address").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const inferences = pgTable("inferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userAddress: text("user_address")
    .notNull()
    .references(() => users.address),
  taskType: taskTypeEnum("task_type").notNull(),
  model: text("model").notNull(),
  input: jsonb("input").notNull(),
  outputType: outputTypeEnum("output_type").notNull(),
  outputData: jsonb("output_data"),
  r2Keys: jsonb("r2_keys").$type<string[]>(),
  status: inferenceStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  predictTimeMs: integer("predict_time_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
