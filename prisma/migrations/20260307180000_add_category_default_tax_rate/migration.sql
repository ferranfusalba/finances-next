-- AlterTable (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserTransactionCategory' AND column_name = 'defaultTaxRate'
  ) THEN
    ALTER TABLE "UserTransactionCategory" ADD COLUMN "defaultTaxRate" DECIMAL;
  END IF;
END $$;
