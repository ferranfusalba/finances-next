/*
  Warnings:

  - You are about to alter the column `defaultTaxRate` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `defaultTaxRate` on the `UserTransactionCategory` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to alter the column `defaultTaxRate` on the `UserTransactionSubcategory` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "AccountTransaction" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BudgetTransaction" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "defaultTaxRate" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "UserTransactionCategory" ALTER COLUMN "defaultTaxRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "color" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserTransactionSubcategory" ALTER COLUMN "defaultTaxRate" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Salary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "employer" TEXT NOT NULL,
    "grossPay" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryLine" (
    "id" TEXT NOT NULL,
    "salaryId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalaryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "salaryId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "concept" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Salary_userId_month_idx" ON "Salary"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Salary_userId_month_employer_key" ON "Salary"("userId", "month", "employer");

-- CreateIndex
CREATE INDEX "SalaryLine_salaryId_idx" ON "SalaryLine"("salaryId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayment_transactionId_key" ON "SalaryPayment"("transactionId");

-- CreateIndex
CREATE INDEX "SalaryPayment_salaryId_idx" ON "SalaryPayment"("salaryId");

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryLine" ADD CONSTRAINT "SalaryLine_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "AccountTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
