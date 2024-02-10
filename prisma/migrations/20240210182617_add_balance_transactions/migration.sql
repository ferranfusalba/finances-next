/*
  Warnings:

  - Added the required column `balance` to the `BudgetTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balance` to the `FinancialAccountTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetTransaction" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "FinancialAccountTransaction" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL;
