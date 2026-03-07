import { db } from "@/lib/db";

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
  const [accountCurrencies, budgetCurrencies] = await Promise.all([
    db.accountTransaction.findMany({
      where: { Account: { userId }, foreignCurrency: { not: "" } },
      select: { foreignCurrency: true },
      distinct: ["foreignCurrency"],
    }),
    db.budgetTransaction.findMany({
      where: { Budget: { userId }, foreignCurrency: { not: "" } },
      select: { foreignCurrency: true },
      distinct: ["foreignCurrency"],
    }),
  ]);

  const codes = new Set<string>();
  for (const t of accountCurrencies) {
    if (t.foreignCurrency) codes.add(t.foreignCurrency);
  }
  for (const t of budgetCurrencies) {
    if (t.foreignCurrency) codes.add(t.foreignCurrency);
  }

  return Array.from(codes).sort();
}

export async function getUserTransactionLocations(userId: string) {
  const [accountLocations, budgetLocations] = await Promise.all([
    db.accountTransaction.findMany({
      where: { Account: { userId }, location: { not: "" } },
      select: { location: true },
      distinct: ["location"],
    }),
    db.budgetTransaction.findMany({
      where: { Budget: { userId }, location: { not: "" } },
      select: { location: true },
      distinct: ["location"],
    }),
  ]);

  const locations = new Set<string>();
  for (const t of accountLocations) {
    if (t.location) locations.add(t.location);
  }
  for (const t of budgetLocations) {
    if (t.location) locations.add(t.location);
  }

  return Array.from(locations).sort();
}

export async function getUserTransactionTags(userId: string) {
  const [accountTags, budgetTags] = await Promise.all([
    db.accountTransaction.findMany({
      where: { Account: { userId }, tags: { isEmpty: false } },
      select: { tags: true },
    }),
    db.budgetTransaction.findMany({
      where: { Budget: { userId }, tags: { isEmpty: false } },
      select: { tags: true },
    }),
  ]);

  const tags = new Set<string>();
  for (const t of accountTags) {
    for (const tag of t.tags) tags.add(tag);
  }
  for (const t of budgetTags) {
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
