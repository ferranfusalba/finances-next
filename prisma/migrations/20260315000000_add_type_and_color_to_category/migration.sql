-- Add type and color columns to UserTransactionCategory
ALTER TABLE "UserTransactionCategory" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'EXPENSE';
ALTER TABLE "UserTransactionCategory" ADD COLUMN "color" TEXT NOT NULL DEFAULT '';

-- Backfill colors for existing categories from a curated palette
DO $$
DECLARE
  palette TEXT[] := ARRAY[
    '4F46E5', '7C3AED', 'DB2777', 'DC2626', 'EA580C',
    'D97706', 'CA8A04', '65A30D', '16A34A', '0D9488',
    '0891B2', '0284C7', '2563EB', '4338CA', '7E22CE',
    'A21CAF', 'BE185D', 'B91C1C', 'C2410C', 'A16207',
    '4D7C0F', '15803D', '0F766E', '0E7490'
  ];
  cat RECORD;
  idx INT := 0;
BEGIN
  FOR cat IN SELECT id FROM "UserTransactionCategory" WHERE "color" = '' LOOP
    UPDATE "UserTransactionCategory"
    SET "color" = palette[(idx % array_length(palette, 1)) + 1]
    WHERE id = cat.id;
    idx := idx + 1;
  END LOOP;
END $$;

-- Drop the old unique index and create the new one
DROP INDEX "UserTransactionCategory_userId_name_key";
CREATE UNIQUE INDEX "UserTransactionCategory_userId_name_type_key" ON "UserTransactionCategory"("userId", "name", "type");
