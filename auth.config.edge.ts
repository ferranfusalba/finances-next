import type { NextAuthConfig } from "next-auth";

// Lightweight config for Edge runtime (middleware)
// No credentials provider, bcrypt, or database calls
export default {
  providers: [],
} satisfies NextAuthConfig;
