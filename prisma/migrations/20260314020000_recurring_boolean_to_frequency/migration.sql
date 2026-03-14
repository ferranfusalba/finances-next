-- AlterTable: Convert recurring from Boolean to String? on AccountTransaction
ALTER TABLE "AccountTransaction" ADD COLUMN "recurring_new" TEXT;
UPDATE "AccountTransaction" SET "recurring_new" = 'MONTHLY' WHERE "recurring" = true;
ALTER TABLE "AccountTransaction" DROP COLUMN "recurring";
ALTER TABLE "AccountTransaction" RENAME COLUMN "recurring_new" TO "recurring";

-- AlterTable: Convert recurring from Boolean to String? on UserTransactionCategory
ALTER TABLE "UserTransactionCategory" ADD COLUMN "recurring_new" TEXT;
UPDATE "UserTransactionCategory" SET "recurring_new" = 'MONTHLY' WHERE "recurring" = true;
ALTER TABLE "UserTransactionCategory" DROP COLUMN "recurring";
ALTER TABLE "UserTransactionCategory" RENAME COLUMN "recurring_new" TO "recurring";

-- AlterTable: Add recurring to UserTransactionSubcategory
ALTER TABLE "UserTransactionSubcategory" ADD COLUMN "recurring" TEXT;
