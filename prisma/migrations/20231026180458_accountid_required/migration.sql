/*
  Warnings:

  - Made the column `accountId` on table `AccountTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AccountTransaction" DROP CONSTRAINT "AccountTransaction_accountId_fkey";

-- AlterTable
ALTER TABLE "AccountTransaction" ALTER COLUMN "accountId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
