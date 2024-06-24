import { Account } from "./Account";
import { Budget } from "./Budget";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: "ADMIN" | "ROLE" | string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  accounts: Array<Account>;
  budgets: Array<Budget>;
  defaultCountry?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
  defaultLocale?: string;
}
