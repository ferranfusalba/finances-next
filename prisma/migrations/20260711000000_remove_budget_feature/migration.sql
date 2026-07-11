-- DropForeignKey
ALTER TABLE "BudgetTransaction" DROP CONSTRAINT "BudgetTransaction_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_userId_fkey";

-- DropTable
DROP TABLE "BudgetTransaction";

-- DropTable
DROP TABLE "Budget";
