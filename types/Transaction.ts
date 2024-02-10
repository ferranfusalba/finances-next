interface Transaction {
  concept: string;
  createdAt: Date;
  currency: string;
  id: number;
  amount: number;
  balance: number;
  notes: string;
  type: string;
  updatedAt: Date;
}

export interface AccountTransaction extends Transaction {
  accountId: number;
}

export interface BudgetTransaction extends Transaction {
  budgetId: number;
}
