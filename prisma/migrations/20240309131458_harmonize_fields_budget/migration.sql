-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT '';
