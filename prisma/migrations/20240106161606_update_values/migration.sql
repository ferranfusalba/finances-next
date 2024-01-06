/*
  Warnings:

  - Made the column `active` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `initialBalance` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `Budget` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Budget` required. This step will fail if there are existing NULL values in that column.
  - Made the column `initialBalance` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "initialBalance" SET NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "initialBalance" SET NOT NULL;
