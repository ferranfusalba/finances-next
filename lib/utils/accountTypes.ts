import { Account } from "@/types/Account";

export function getUniqueAccountTypes(accounts: Account[]): string[] {
  const types = new Set<string>();
  for (const account of accounts) {
    if (account.type) types.add(account.type);
  }
  return Array.from(types);
}
