/*
  Warnings:

  - Made the column `budgetId` on table `BudgetTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BudgetTransaction" DROP CONSTRAINT "BudgetTransaction_budgetId_fkey";

-- AlterTable
ALTER TABLE "BudgetTransaction" ALTER COLUMN "budgetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "BudgetTransaction" ADD CONSTRAINT "BudgetTransaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
