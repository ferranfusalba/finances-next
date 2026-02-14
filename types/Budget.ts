import { BudgetTransaction } from "./Transaction";

export interface Budget {
  id: string;
  order: number;
  name: string;
  code: string;
  active: boolean;
  type: string;
  description: string | null;
  defaultCurrency: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Array<BudgetTransaction>;
}
