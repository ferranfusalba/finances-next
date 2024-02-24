-- AlterTable
ALTER TABLE "FinancialAccountTransaction" ADD COLUMN     "foreignCurrency" TEXT DEFAULT '',
ADD COLUMN     "foreignCurrencyAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "foreignCurrencyExchangeRate" DOUBLE PRECISION DEFAULT 0;
