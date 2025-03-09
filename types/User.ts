import { Account } from "./Account";
import { Budget } from "./Budget";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  role: "ADMIN" | "ROLE" | string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  accounts?: Array<Account> | null;
  budgets?: Array<Budget> | null;
  defaultCountry?: string | null;
  defaultCurrency?: string | null;
  defaultTimezone?: string | null;
  defaultLocale?: string | null;
  theme?: string | null;
  isOAuth: boolean | null;
}
