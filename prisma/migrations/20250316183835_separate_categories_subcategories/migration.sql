/*
  Warnings:

  - You are about to drop the column `parentCategoryId` on the `UserTransactionCategory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserTransactionCategory" DROP CONSTRAINT "UserTransactionCategory_parentCategoryId_fkey";

-- AlterTable
ALTER TABLE "UserTransactionCategory" DROP COLUMN "parentCategoryId";

-- CreateTable
CREATE TABLE "UserTransactionSubcategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "UserTransactionSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactionSubcategory_categoryId_name_key" ON "UserTransactionSubcategory"("categoryId", "name");

-- AddForeignKey
ALTER TABLE "UserTransactionSubcategory" ADD CONSTRAINT "UserTransactionSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "UserTransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
