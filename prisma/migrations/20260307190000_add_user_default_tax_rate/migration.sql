-- AlterTable (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'defaultTaxRate'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "defaultTaxRate" DECIMAL NOT NULL DEFAULT 21;
  END IF;
END $$;
