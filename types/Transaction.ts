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
  dateTime: Date;
  // timezone: string;
  // location: string;
  notes: string;
  category: string;
}
// TODO: Review optional fields & implications (page AccountLayout)

export interface AccountTransaction extends Transaction {
  accountId: number;
}

export interface BudgetTransaction extends Transaction {
  budgetId: number;
}
