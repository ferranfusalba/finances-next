-- Convert location from String to Json for AccountTransaction
-- First, convert existing non-empty string values to JSON objects with just a name
UPDATE "AccountTransaction"
SET "location" = NULL
WHERE "location" IS NULL OR "location" = '';

ALTER TABLE "AccountTransaction"
ALTER COLUMN "location" DROP DEFAULT,
ALTER COLUMN "location" TYPE JSONB USING
  CASE
    WHEN "location" IS NOT NULL AND "location"::text != '' THEN
      jsonb_build_object('name', "location"::text, 'address', '', 'lat', 0, 'lng', 0, 'placeId', '')
    ELSE NULL
  END;

-- Convert location from String to Json for BudgetTransaction
UPDATE "BudgetTransaction"
SET "location" = NULL
WHERE "location" IS NULL OR "location" = '';

ALTER TABLE "BudgetTransaction"
ALTER COLUMN "location" DROP DEFAULT,
ALTER COLUMN "location" TYPE JSONB USING
  CASE
    WHEN "location" IS NOT NULL AND "location"::text != '' THEN
      jsonb_build_object('name', "location"::text, 'address', '', 'lat', 0, 'lng', 0, 'placeId', '')
    ELSE NULL
  END;
