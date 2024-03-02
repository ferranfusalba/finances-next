/*
  Warnings:

  - The primary key for the `BudgetTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FinancialAccountTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "BudgetTransaction" DROP CONSTRAINT "BudgetTransaction_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BudgetTransaction_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BudgetTransaction_id_seq";

-- AlterTable
ALTER TABLE "FinancialAccountTransaction" DROP CONSTRAINT "FinancialAccountTransaction_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FinancialAccountTransaction_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FinancialAccountTransaction_id_seq";
