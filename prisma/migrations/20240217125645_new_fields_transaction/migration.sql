-- AlterTable
ALTER TABLE "FinancialAccountTransaction" ADD COLUMN     "category" TEXT,
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "timezone" TEXT;
