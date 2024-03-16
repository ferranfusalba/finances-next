/*
  Warnings:

  - A unique constraint covering the columns `[userId,code]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,number]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_userId_code_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_code_key" ON "Account"("userId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_number_key" ON "Account"("userId", "number");
