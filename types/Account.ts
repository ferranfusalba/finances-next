import type { AccountTypeValue } from "@/lib/utils/account";

import { AccountTransaction } from "./Transaction";

export interface Account {
  id: string;
  order: number;
  name: string;
  code: string;
  bankName: string;
  active: boolean;
  type: AccountTypeValue;
  description: string | null;
  defaultCurrency: string;
  currentBalance: number;
  number: string | null;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Array<AccountTransaction>;
  /** Set on an INVESTMENT_CASH leg, pointing at its INVESTMENT parent. */
  parentAccountId?: string | null;
}
