ALTER TABLE "inferences"
  ADD COLUMN IF NOT EXISTS "estimated_cost_usdc" numeric(18, 6),
  ADD COLUMN IF NOT EXISTS "actual_cost_usdc" numeric(18, 6),
  ADD COLUMN IF NOT EXISTS "payment_tx_hash" text,
  ADD COLUMN IF NOT EXISTS "payment_chain_id" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inferences_payment_tx_hash_unique'
      AND conrelid = 'inferences'::regclass
  ) THEN
    ALTER TABLE "inferences"
      ADD CONSTRAINT "inferences_payment_tx_hash_unique" UNIQUE ("payment_tx_hash");
  END IF;
END $$;
