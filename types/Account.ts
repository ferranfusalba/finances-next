import { AccountTransaction } from "./Transaction";

export interface Account {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: number | null;
  currentBalance: number | null;
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
