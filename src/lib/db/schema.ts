import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  integer,
  numeric,
  boolean,
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
  hasClaimedFreeInferences: boolean("has_claimed_free_inferences")
    .notNull()
    .default(false),
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
  estimatedCostUsdc: numeric("estimated_cost_usdc", { precision: 18, scale: 6 }),
  actualCostUsdc: numeric("actual_cost_usdc", { precision: 18, scale: 6 }),
  paymentTxHash: text("payment_tx_hash").unique(),
  paymentChainId: integer("payment_chain_id"),
  isPublic: integer("is_public").notNull().default(0),
  isFreeInference: integer("is_free_inference").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const freeInferenceGrants = pgTable("free_inference_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address")
    .notNull()
    .unique()
    .references(() => users.address),
  creditAmount: integer("credit_amount").notNull().default(5),
  usedCount: integer("used_count").notNull().default(0),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
