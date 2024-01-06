/*
  Warnings:

  - Changed the type of `initialBalance` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `initialBalance` on the `Budget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "initialBalance",
ADD COLUMN     "initialBalance" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "initialBalance",
ADD COLUMN     "initialBalance" INTEGER NOT NULL;
