-- AlterTable (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserTransactionSubcategory' AND column_name = 'defaultTaxRate'
  ) THEN
    ALTER TABLE "UserTransactionSubcategory" ADD COLUMN "defaultTaxRate" DECIMAL;
  END IF;
END $$;
