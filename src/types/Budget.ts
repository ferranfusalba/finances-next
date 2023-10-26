import { BudgetTransaction } from "./Transaction";

export interface Budget {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: string | null;
  name: string;
  type: number | null;
  updatedAt: Date;
  transactions?: Array<BudgetTransaction>;
}

export interface BudgetParamsProps {
  params: {
    id: string;
  };
}
