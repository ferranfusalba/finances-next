/*
  Warnings:

  - You are about to drop the `TypeTransfer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountTransaction" DROP CONSTRAINT "AccountTransaction_id_fkey";

-- AlterTable
ALTER TABLE "AccountTransaction" ADD COLUMN     "typeTransferDestination" TEXT DEFAULT '',
ADD COLUMN     "typeTransferOrigin" TEXT DEFAULT '';

-- DropTable
DROP TABLE "TypeTransfer";
