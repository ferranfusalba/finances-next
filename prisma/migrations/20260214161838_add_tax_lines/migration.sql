-- AlterTable
ALTER TABLE "AccountTransaction" ADD COLUMN     "taxLines" JSONB;

-- AlterTable
ALTER TABLE "BudgetTransaction" ADD COLUMN     "taxLines" JSONB;
