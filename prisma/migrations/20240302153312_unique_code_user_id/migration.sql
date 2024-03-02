/*
  Warnings:

  - A unique constraint covering the columns `[userId,code]` on the table `FinancialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_userId_code_key" ON "FinancialAccount"("userId", "code");
