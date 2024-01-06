/*
  Warnings:

  - Added the required column `code` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Budget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "code" TEXT NOT NULL;
