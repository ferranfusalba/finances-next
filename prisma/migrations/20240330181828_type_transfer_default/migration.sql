-- AlterTable
ALTER TABLE "TypeTransfer" ALTER COLUMN "destinationAccountId" DROP NOT NULL,
ALTER COLUMN "destinationAccountId" SET DEFAULT '';
