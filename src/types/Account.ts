import { Transaction } from "./Transaction";

export interface Account {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: string | null;
  name: string;
  type: number | null;
  updatedAt: Date;
  // transactions: Array<Transaction> | null;
}

export interface AccountParamsProps {
  params: {
    id: string;
  };
}
