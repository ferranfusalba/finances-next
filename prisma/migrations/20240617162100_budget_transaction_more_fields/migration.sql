-- AlterTable
ALTER TABLE "BudgetTransaction" ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "foreignCurrency" TEXT DEFAULT '',
ADD COLUMN     "foreignCurrencyAmount" DOUBLE PRECISION DEFAULT 0.00,
ADD COLUMN     "foreignCurrencyExchangeRate" DOUBLE PRECISION DEFAULT 0.00,
ADD COLUMN     "location" TEXT DEFAULT '',
ADD COLUMN     "timezone" TEXT DEFAULT '';
