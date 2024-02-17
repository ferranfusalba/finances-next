interface Transaction {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  payee: string;
  concept: string;
  type: string;
  currency: string;
  amount: number;
  balance: number;
  category: string;
  dateTime: Date;
  timezone: string;
  location: string;
  notes: string;
}

export interface AccountTransaction extends Transaction {
  accountId: number;
}

export interface BudgetTransaction extends Transaction {
  budgetId: number;
}
