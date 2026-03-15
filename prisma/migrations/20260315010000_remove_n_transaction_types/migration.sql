-- Convert INCOME_N transactions to INCOME
UPDATE "AccountTransaction" SET "type" = 'INCOME' WHERE "type" = 'INCOME_N';

-- Convert EXPENSE_N transactions to EXPENSE
UPDATE "AccountTransaction" SET "type" = 'EXPENSE' WHERE "type" = 'EXPENSE_N';

-- Same for budget transactions
UPDATE "BudgetTransaction" SET "type" = 'INCOME' WHERE "type" = 'INCOME_N';
UPDATE "BudgetTransaction" SET "type" = 'EXPENSE' WHERE "type" = 'EXPENSE_N';
