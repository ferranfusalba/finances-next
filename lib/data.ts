import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import type { TransactionLocation } from "@/types/TransactionLocation";

export async function getRecurringPayments(userId: string) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      Account: { userId },
      NOT: { recurring: null },
    },
    orderBy: {
      dateTime: "asc",
    },
    select: {
      id: true,
      dateTime: true,
      payee: true,
      concept: true,
      accountId: true,
      amount: true,
      currency: true,
      recurring: true,
    },
  });

  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
  }));
}

export async function getSalesTaxTransactions(userId: string) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      Account: { userId },
      taxLines: { some: {} },
    },
    orderBy: {
      dateTime: "asc",
    },
    select: {
      id: true,
      dateTime: true,
      payee: true,
      concept: true,
      accountId: true,
      amount: true,
      currency: true,
      taxLines: {
        select: {
          rate: true,
          amount: true,
          inclusive: true,
          taxAmount: true,
        },
      },
    },
  });

  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    taxLines: t.taxLines.map((tl) => ({
      rate: toNumber(tl.rate),
      amount: toNumber(tl.amount),
      inclusive: tl.inclusive,
      taxAmount: toNumber(tl.taxAmount),
    })),
    totalTax: toNumber(
      t.taxLines.reduce(
        (sum, tl) => sum.add(tl.taxAmount),
        new Prisma.Decimal(0),
      ),
    ),
  }));
}

export interface LocationWithTransactions {
  location: TransactionLocation;
  transactions: {
    id: string;
    dateTime: Date;
    payee: string;
    concept: string;
    amount: number;
    currency: string;
  }[];
}

export async function getTransactionLocations(
  userId: string,
): Promise<LocationWithTransactions[]> {
  const transactions = await db.accountTransaction.findMany({
    where: {
      Account: { userId },
      location: { not: Prisma.DbNull },
    },
    orderBy: {
      dateTime: "desc",
    },
    select: {
      id: true,
      dateTime: true,
      payee: true,
      concept: true,
      amount: true,
      currency: true,
      location: true,
    },
  });

  const map = new Map<string, LocationWithTransactions>();

  for (const t of transactions) {
    const loc = t.location as TransactionLocation | null;
    if (!loc?.placeId) continue;

    if (!map.has(loc.placeId)) {
      map.set(loc.placeId, { location: loc, transactions: [] });
    }
    map.get(loc.placeId)!.transactions.push({
      id: t.id,
      dateTime: t.dateTime,
      payee: t.payee,
      concept: t.concept,
      amount: toNumber(t.amount),
      currency: t.currency,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.location.name.localeCompare(b.location.name),
  );
}
