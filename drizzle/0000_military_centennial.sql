CREATE TYPE "public"."inference_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."output_type" AS ENUM('text', 'image', 'audio');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('text-to-image', 'text-to-text', 'text-to-sound');--> statement-breakpoint
CREATE TABLE "inferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"task_type" "task_type" NOT NULL,
	"model" text NOT NULL,
	"input" jsonb NOT NULL,
	"output_type" "output_type" NOT NULL,
	"output_data" jsonb,
	"r2_keys" jsonb,
	"status" "inference_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"predict_time_ms" integer,
	"estimated_cost_usdc" numeric(18, 6),
	"actual_cost_usdc" numeric(18, 6),
	"payment_tx_hash" text,
	"payment_chain_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inferences_payment_tx_hash_unique" UNIQUE("payment_tx_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inferences" ADD CONSTRAINT "inferences_user_address_users_address_fk" FOREIGN KEY ("user_address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;