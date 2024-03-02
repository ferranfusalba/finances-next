/*
  Warnings:

  - A unique constraint covering the columns `[userId,code]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Budget_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_code_key" ON "Budget"("userId", "code");
