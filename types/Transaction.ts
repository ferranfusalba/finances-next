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
  foreignCurrency?: string | null;
  foreignCurrencyAmount?: number | null;
  foreignCurrencyExchangeRate?: number | null;
  dateTime: Date;
  timezone?: string | null;
  location?: string | null;
  notes: string;
  category: string;
  subcategory?: string | null;
  tags?: string | null; // TODO: Move it to string[] ?
}
// TODO: Review optional fields & implications (page AccountLayout)

export interface AccountTransaction extends Transaction {
  accountId: number;
}

export interface BudgetTransaction extends Transaction {
  budgetId: number;
}
