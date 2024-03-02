/*
  Warnings:

  - The primary key for the `Budget` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "BudgetTransaction" DROP CONSTRAINT "BudgetTransaction_budgetId_fkey";

-- AlterTable
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Budget_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Budget_id_seq";

-- AlterTable
ALTER TABLE "BudgetTransaction" ALTER COLUMN "budgetId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "BudgetTransaction" ADD CONSTRAINT "BudgetTransaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
