import { BudgetTransaction } from "./Transaction";

export interface Budget {
  id: string;
  order: number;
  name: string;
  code: string;
  bankName: null;
  active: boolean | null;
  type: string | null;
  description: string | null;
  defaultCurrency: string | null;
  initialBalance: number | null;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Array<BudgetTransaction>;
}
