import { AccountTransaction } from "./Transaction";

export interface Account {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: string | null;
  name: string;
  type: number | null;
  updatedAt: Date;
  transactions?: Array<AccountTransaction>;
}

export interface AccountParamsProps {
  params: {
    id: string;
  };
}
