/*
  Warnings:

  - A unique constraint covering the columns `[userTransactionCategoryId,name]` on the table `TransactionCategorySubcategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `UserTransactionCategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `UserTransactionPayee` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userTransactionCategoryId` on table `TransactionCategorySubcategory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TransactionCategorySubcategory" DROP CONSTRAINT "TransactionCategorySubcategory_userTransactionCategoryId_fkey";

-- DropIndex
DROP INDEX "TransactionCategorySubcategory_name_key";

-- DropIndex
DROP INDEX "UserTransactionCategory_name_key";

-- DropIndex
DROP INDEX "UserTransactionPayee_name_key";

-- AlterTable
ALTER TABLE "TransactionCategorySubcategory" ALTER COLUMN "userTransactionCategoryId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategorySubcategory_userTransactionCategoryId_na_key" ON "TransactionCategorySubcategory"("userTransactionCategoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactionCategory_userId_name_key" ON "UserTransactionCategory"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactionPayee_userId_name_key" ON "UserTransactionPayee"("userId", "name");

-- AddForeignKey
ALTER TABLE "TransactionCategorySubcategory" ADD CONSTRAINT "TransactionCategorySubcategory_userTransactionCategoryId_fkey" FOREIGN KEY ("userTransactionCategoryId") REFERENCES "UserTransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
