import { Account } from "./Account";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
  accounts?: Array<Account> | null;
  userCountry?: string | null;
  userCurrency?: string | null;
  userTimezone?: string | null;
  userLocale?: string | null;
  theme?: string | null;
}
