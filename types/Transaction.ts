interface Transaction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  concept: string;
  type: string;
  currency: string;
  amount: number;
  balance: number;
  category: string;
  subcategory?: string | null;
  tags?: string | null;
  notes: string;
}

export interface AccountTransaction extends Transaction {
  payee: string;
  foreignCurrency?: string | null;
  foreignCurrencyAmount?: number | null;
  foreignCurrencyExchangeRate?: number | null;
  dateTime: Date;
  timezone?: string | null;
  location?: string | null;
  accountId: string;
}

export interface BudgetTransaction extends Transaction {
  budgetId: string;
}
