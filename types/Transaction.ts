interface Transaction {
  amount: number;
  balance: number;
  category: string;
  concept: string;
  createdAt: Date;
  currency: string;
  dateTime: Date;
  foreignCurrency?: string | null;
  foreignCurrencyAmount?: number | null;
  foreignCurrencyExchangeRate?: number | null;
  id: string;
  location?: string | null;
  notes: string;
  subcategory?: string | null;
  tags?: string | null;
  timezone?: string | null;
  type: string;
  updatedAt: Date;
}

export interface AccountTransaction extends Transaction {
  accountId: string;
  payee: string;
  typeTransferDestination: string | null;
  typeTransferOrigin: string | null;
}

export interface BudgetTransaction extends Transaction {
  budgetId: string;
}
