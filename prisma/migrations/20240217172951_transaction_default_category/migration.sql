/*
  Warnings:

  - Made the column `category` on table `FinancialAccountTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FinancialAccountTransaction" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT '';
