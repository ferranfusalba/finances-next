/*
  Warnings:

  - You are about to drop the column `import` on the `FinancialAccountTransaction` table. All the data in the column will be lost.
  - Added the required column `amount` to the `FinancialAccountTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FinancialAccountTransaction" DROP COLUMN "import",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;
