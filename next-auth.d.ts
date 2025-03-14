import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: "ADMIN" | "USER";
  isOAuth: boolean;
  defaultCountry: string;
  defaultCurrency: string;
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
  }
}
