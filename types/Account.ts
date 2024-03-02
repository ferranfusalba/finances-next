import { AccountTransaction } from "./Transaction";

export interface Account {
  active: boolean | null;
  bankName: string;
  createdAt: Date;
  description: string | null;
  id: string;
  initialBalance: number | null;
  currentBalance: number;
  name: string;
  code: string;
  type: string | null;
  order: number;
  updatedAt: Date;
  transactions?: Array<AccountTransaction>;
}

export interface AccountParamsProps {
  params: {
    id: string;
    code: string;
  };
}
