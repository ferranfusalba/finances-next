import type { TransactionLocation } from "@/types/TransactionLocation";

export interface TaxLine {
  id: string;
  rate: number;
  amount: number;
  inclusive: boolean;
  taxAmount: number;
  accountTransactionId: string;
}

interface Transaction {
  amount: number;
  category: string;
  concept: string;
  createdAt: Date;
  currency: string;
  dateTime: Date;
  foreignCurrency?: string | null;
  foreignCurrencyAmount?: number | null;
  foreignCurrencyExchangeRate?: number | null;
  id: string;
  location?: TransactionLocation | null;
  notes: string;
  subcategory?: string | null;
  tags?: string[];
  timezone?: string | null;
  type: string;
  updatedAt: Date;
}

export interface AccountTransaction extends Transaction {
  accountId: string;
  payee: string;
  recurring: string | null;
  taxLines?: TaxLine[] | null;
  transferId?: string | null;
  typeTransferDestination?: string | null;
  typeTransferOrigin?: string | null;
}

export interface BudgetTransaction extends Transaction {
  balance: number;
  budgetId: string;
}
