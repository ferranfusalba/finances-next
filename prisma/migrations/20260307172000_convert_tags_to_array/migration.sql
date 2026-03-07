-- AlterTable: convert tags from nullable text to text array
ALTER TABLE "AccountTransaction" DROP COLUMN "tags",
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "BudgetTransaction" DROP COLUMN "tags",
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
