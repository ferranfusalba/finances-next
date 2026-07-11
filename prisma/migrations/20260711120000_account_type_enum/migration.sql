-- Account.type: free-text String -> AccountType enum

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH', 'PREPAID', 'INVESTMENT');

-- Add the new column as nullable so we can backfill before enforcing NOT NULL.
ALTER TABLE "Account" ADD COLUMN "type_new" "AccountType";

-- Explicit backfill. There is deliberately NO catch-all default: an unrecognised
-- value stays NULL and the guard below aborts the migration. Defaulting to
-- CHECKING would silently mislabel an investment account, which then reports
-- cost basis as its balance with nothing to flag it.
UPDATE "Account"
SET "type_new" = CASE
  -- Values present in the known dataset.
  WHEN "type" = 'Investments'                    THEN 'INVESTMENT'::"AccountType"
  WHEN "type" = 'Employee Benefits Prepaid Card' THEN 'PREPAID'::"AccountType"
  WHEN "type" = 'Checking' AND "bankName" = 'CoinBox' THEN 'CASH'::"AccountType"
  WHEN "type" = 'Checking'                       THEN 'CHECKING'::"AccountType"
  -- Case-insensitive fallbacks: historical rows use inconsistent casing
  -- ("CHECKING" vs "Checking"), so match anything that already names a member.
  WHEN upper("type") = 'CHECKING'                THEN 'CHECKING'::"AccountType"
  WHEN upper("type") = 'SAVINGS'                 THEN 'SAVINGS'::"AccountType"
  WHEN upper("type") = 'CASH'                    THEN 'CASH'::"AccountType"
  WHEN upper("type") = 'PREPAID'                 THEN 'PREPAID'::"AccountType"
  WHEN upper("type") IN ('INVESTMENT', 'INVESTMENTS') THEN 'INVESTMENT'::"AccountType"
  ELSE NULL
END;

-- Abort rather than mislabel. If this fires, extend the CASE above and re-run.
DO $$
DECLARE unmapped TEXT;
BEGIN
  SELECT string_agg(DISTINCT "type", ', ') INTO unmapped
  FROM "Account"
  WHERE "type_new" IS NULL;

  IF unmapped IS NOT NULL THEN
    RAISE EXCEPTION 'Unmapped Account.type value(s): %. Extend the CASE in this migration instead of defaulting.', unmapped;
  END IF;
END $$;

-- Swap the column in.
ALTER TABLE "Account" DROP COLUMN "type";
ALTER TABLE "Account" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Account" ALTER COLUMN "type" SET NOT NULL;
