-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "order" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "order" SERIAL NOT NULL;
