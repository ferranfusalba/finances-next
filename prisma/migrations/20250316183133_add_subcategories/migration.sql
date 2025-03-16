/*
  Warnings:

  - You are about to drop the `TransactionCategorySubcategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TransactionCategorySubcategory" DROP CONSTRAINT "TransactionCategorySubcategory_userTransactionCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserTransactionCategory" DROP CONSTRAINT "UserTransactionCategory_userId_fkey";

-- AlterTable
ALTER TABLE "UserTransactionCategory" ADD COLUMN     "parentCategoryId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "TransactionCategorySubcategory";

-- AddForeignKey
ALTER TABLE "UserTransactionCategory" ADD CONSTRAINT "UserTransactionCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTransactionCategory" ADD CONSTRAINT "UserTransactionCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "UserTransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
