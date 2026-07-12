-- Split the investment model into an invested leg and a cash leg.
--
-- Hand-written, because a schema diff CANNOT express a rename: Prisma would see
-- INVESTMENT_CASH and INVESTMENT_LEGACY as two *added* values and leave existing
-- accounts on INVESTMENT — which now means "the invested leg", narrowed to
-- Return/Rounding/Transfer. The four existing investment accounts hold INCOME
-- and EXPENSE rows; that silent reinterpretation would make those rows fail the
-- API's type guard and lock them out of editing.
--
-- RENAME VALUE carries existing rows with it, so they land on INVESTMENT_LEGACY
-- and keep behaving exactly as they do today. INVESTMENT is then re-added, fresh
-- and empty, for the new model.

-- 1. The existing accounts become legacy. Rows follow the rename automatically.
ALTER TYPE "AccountType" RENAME VALUE 'INVESTMENT' TO 'INVESTMENT_LEGACY';

-- 2. Re-add INVESTMENT with its new meaning: the invested position only.
ALTER TYPE "AccountType" ADD VALUE 'INVESTMENT';

-- 3. The cash leg.
ALTER TYPE "AccountType" ADD VALUE 'INVESTMENT_CASH';

-- 4. The cash leg hangs off its invested parent. ON DELETE SET NULL: deleting the
--    parent must not cascade away the child's transactions — it orphans the child,
--    which is recoverable, rather than destroying a ledger, which is not.
ALTER TABLE "Account" ADD COLUMN "parentAccountId" TEXT;

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_parentAccountId_fkey"
  FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Account_parentAccountId_idx" ON "Account"("parentAccountId");
