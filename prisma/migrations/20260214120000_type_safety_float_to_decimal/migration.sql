-- Update NULL values to empty string before making columns required
UPDATE "User" SET "defaultCountry" = '' WHERE "defaultCountry" IS NULL;
UPDATE "User" SET "defaultCurrency" = '' WHERE "defaultCurrency" IS NULL;
UPDATE "User" SET "defaultTimezone" = '' WHERE "defaultTimezone" IS NULL;
UPDATE "User" SET "defaultLocale" = '' WHERE "defaultLocale" IS NULL;
UPDATE "User" SET "theme" = '' WHERE "theme" IS NULL;

-- Make User preference columns non-nullable (they already have @default(""))
ALTER TABLE "User" ALTER COLUMN "defaultCountry" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "defaultCurrency" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "defaultTimezone" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "defaultLocale" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "theme" SET NOT NULL;

-- Migrate financial fields from DoublePrecision (Float) to Decimal
ALTER TABLE "Account" ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(65,30);

ALTER TABLE "AccountTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "AccountTransaction" ALTER COLUMN "foreignCurrencyAmount" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "AccountTransaction" ALTER COLUMN "foreignCurrencyExchangeRate" SET DATA TYPE DECIMAL(65,30);

ALTER TABLE "Budget" ALTER COLUMN "initialBalance" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "Budget" ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(65,30);

ALTER TABLE "BudgetTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "BudgetTransaction" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "BudgetTransaction" ALTER COLUMN "foreignCurrencyAmount" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "BudgetTransaction" ALTER COLUMN "foreignCurrencyExchangeRate" SET DATA TYPE DECIMAL(65,30);
