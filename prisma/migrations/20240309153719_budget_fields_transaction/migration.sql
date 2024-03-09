-- AlterTable
ALTER TABLE "BudgetTransaction" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subcategory" TEXT DEFAULT '',
ADD COLUMN     "tags" TEXT DEFAULT '';
