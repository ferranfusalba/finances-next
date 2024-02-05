/*
  Warnings:

  - You are about to drop the `AccountTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountTransaction" DROP CONSTRAINT "AccountTransaction_accountId_fkey";

-- DropTable
DROP TABLE "AccountTransaction";

-- CreateTable
CREATE TABLE "FinancialAccountTransaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "import" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,

    CONSTRAINT "FinancialAccountTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinancialAccountTransaction" ADD CONSTRAINT "FinancialAccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
