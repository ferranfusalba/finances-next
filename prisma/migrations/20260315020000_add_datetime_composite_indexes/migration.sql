-- CreateIndex
CREATE INDEX "AccountTransaction_accountId_dateTime_idx" ON "AccountTransaction"("accountId", "dateTime");

-- CreateIndex
CREATE INDEX "BudgetTransaction_budgetId_dateTime_idx" ON "BudgetTransaction"("budgetId", "dateTime");
