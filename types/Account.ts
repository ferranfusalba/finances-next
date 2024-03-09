import { AccountTransaction } from "./Transaction";

export interface Account {
  id: string;
  order: number;
  name: string;
  code: string;
  bankName: string;
  active: boolean | null;
  type: string | null;
  description: string | null;
  defaultCurrency: string | null;
  initialBalance: number | null;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Array<AccountTransaction>;
}
