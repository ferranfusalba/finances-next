/*
  Warnings:

  - The primary key for the `FinancialAccount` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "FinancialAccountTransaction" DROP CONSTRAINT "FinancialAccountTransaction_accountId_fkey";

-- AlterTable
ALTER TABLE "FinancialAccount" DROP CONSTRAINT "FinancialAccount_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FinancialAccount_id_seq";

-- AlterTable
ALTER TABLE "FinancialAccountTransaction" ALTER COLUMN "accountId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "FinancialAccountTransaction" ADD CONSTRAINT "FinancialAccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
