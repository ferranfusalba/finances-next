import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { TransactionLocation } from "@/types/TransactionLocation";

export default async function getUser(userEmail: string) {
  return await db.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}

export async function getUserTransactionPayees(id: string) {
  return await db.userTransactionPayee.findMany({
    where: {
      userId: id,
    },
  });
}

export async function getUserForeignCurrencies(userId: string) {
  const accountCurrencies = await db.accountTransaction.findMany({
    where: { Account: { userId }, foreignCurrency: { not: "" } },
    select: { foreignCurrency: true },
    distinct: ["foreignCurrency"],
  });

  const codes = new Set<string>();
  for (const t of accountCurrencies) {
    if (t.foreignCurrency) codes.add(t.foreignCurrency);
  }

  return Array.from(codes).sort();
}

export async function getUserTransactionLocations(userId: string): Promise<TransactionLocation[]> {
  const accountTransactions = await db.accountTransaction.findMany({
    where: { Account: { userId }, location: { not: Prisma.DbNull } },
    select: { location: true },
  });

  const seen = new Map<string, TransactionLocation>();
  for (const t of accountTransactions) {
    const loc = t.location as TransactionLocation | null;
    if (loc?.placeId && !seen.has(loc.placeId)) {
      seen.set(loc.placeId, loc);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUserTransactionTags(userId: string) {
  const accountTags = await db.accountTransaction.findMany({
    where: { Account: { userId }, tags: { isEmpty: false } },
    select: { tags: true },
  });

  const tags = new Set<string>();
  for (const t of accountTags) {
    for (const tag of t.tags) tags.add(tag);
  }

  return Array.from(tags).sort();
}

export async function getUserTransactionCategories(id: string) {
  return await db.userTransactionCategory.findMany({
    where: {
      userId: id,
    },
    include: {
      subcategories: true,
    },
  });
}

export async function getUserDefaultTaxRate(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { defaultTaxRate: true },
  });
  return user?.defaultTaxRate != null ? Number(String(user.defaultTaxRate)) : 21;
}
