import { BudgetTransaction } from "./Transaction";

export interface Budget {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: number | null;
  name: string;
  code: string;
  type: string | null;
  updatedAt: Date;
  transactions?: Array<BudgetTransaction>;
}

export interface BudgetParamsProps {
  params: {
    id: string;
  };
}
