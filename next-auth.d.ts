import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: "ADMIN" | "USER";
  isOAuth: boolean;
  userCountry: string;
  userCurrency: string;
  userTimezone: string;
  userLocale: string;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
    isOAuth?: boolean;
    userCountry?: string;
    userCurrency?: string;
    userTimezone?: string;
    userLocale?: string;
  }
}
