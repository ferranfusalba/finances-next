/*
  Warnings:

  - A unique constraint covering the columns `[userId,code,number]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_userId_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_code_number_key" ON "Account"("userId", "code", "number");
