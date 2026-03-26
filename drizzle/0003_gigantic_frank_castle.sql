CREATE TABLE "free_inference_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"credit_amount" integer DEFAULT 5 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "free_inference_grants_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "inferences" ADD COLUMN "is_free_inference" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_claimed_free_inferences" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "free_inference_grants" ADD CONSTRAINT "free_inference_grants_address_users_address_fk" FOREIGN KEY ("address") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;