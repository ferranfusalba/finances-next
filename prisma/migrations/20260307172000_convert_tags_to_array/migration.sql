-- AlterTable: convert tags from nullable text to text array (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AccountTransaction' AND column_name = 'tags' AND data_type = 'text'
  ) THEN
    ALTER TABLE "AccountTransaction" DROP COLUMN "tags";
    ALTER TABLE "AccountTransaction" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BudgetTransaction' AND column_name = 'tags' AND data_type = 'text'
  ) THEN
    ALTER TABLE "BudgetTransaction" DROP COLUMN "tags";
    ALTER TABLE "BudgetTransaction" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;
