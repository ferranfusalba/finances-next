import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { decomposeInvestment } from "@/lib/utils/transaction";
import { buildDateTimeFilter } from "@/lib/utils/yearFilter";
import type { TransactionLocation } from "@/types/TransactionLocation";

export async function getAccounts(userId: string) {
  const accounts = await db.account.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      order: "asc",
    },
  });
  return accounts.map((a) => ({
    ...a,
    currentBalance: toNumber(a.currentBalance),
  }));
}

/**
 * Accounts for a list or nav: child legs are folded into their parent rather
 * than listed alongside it, and the parent carries the combined balance.
 *
 * Deliberately NOT the same as getAccounts. That one must keep returning every
 * account, because the transfer-destination picker has to be able to send money
 * to a cash leg — hiding it there would make the split unusable.
 */
export async function getAccountsForList(userId: string) {
  const accounts = await getAccounts(userId);
  const childrenByParent = new Map<string, typeof accounts>();

  for (const account of accounts) {
    if (!account.parentAccountId) continue;
    const siblings = childrenByParent.get(account.parentAccountId) ?? [];
    siblings.push(account);
    childrenByParent.set(account.parentAccountId, siblings);
  }

  return accounts
    .filter((account) => !account.parentAccountId)
    .map((account) => ({
      ...account,
      currentBalance: rollUpBalance(
        account,
        childrenByParent.get(account.id) ?? [],
      ),
    }));
}

/**
 * An account's child legs — today, the INVESTMENT_CASH account hanging off an
 * INVESTMENT one. Ordered so the page renders them deterministically.
 */
export async function getChildAccounts(parentAccountId: string) {
  const accounts = await db.account.findMany({
    where: { parentAccountId },
    orderBy: { order: "asc" },
  });
  return accounts.map((a) => ({
    ...a,
    currentBalance: toNumber(a.currentBalance),
  }));
}

/**
 * What the provider is worth in total: the invested position plus the cash it is
 * holding for you. Both legs are real accounts with real balances, so this is
 * just their sum — but it is the number you reconcile against the statement, so
 * it belongs in one place rather than being re-added at each call site.
 *
 * Legs in different currencies are NOT summed — adding EUR to USD would be a
 * lie. The parent's own balance is returned in that case.
 */
export function rollUpBalance(
  account: { defaultCurrency: string; currentBalance: number },
  children: Array<{ defaultCurrency: string; currentBalance: number }>,
): number {
  return children
    .filter((c) => c.defaultCurrency === account.defaultCurrency)
    .reduce((sum, c) => sum + c.currentBalance, account.currentBalance);
}

/**
 * Where an investment's balance came from: what you paid in, what the market
 * made, what the provider took.
 *
 * Deliberately NOT year-filtered. The decomposition is a lifetime statement —
 * scoped to a year, the opening row would fall outside the window and the
 * identity `balance = opening + contributions + return + ...` would stop holding,
 * which is the one thing that makes the figures trustworthy.
 *
 * Grouped in the database rather than pulled row by row: this runs on every
 * investment page load and only ever needs six sums.
 */
export async function getInvestmentDecomposition(accountIds: string[]) {
  const grouped = await db.accountTransaction.groupBy({
    by: ["type"],
    where: { accountId: { in: accountIds } },
    _sum: { amount: true },
  });

  return decomposeInvestment(
    grouped.map((row) => ({
      type: row.type,
      amount: toNumber(row._sum.amount ?? 0),
    })),
  );
}

export async function recomputeAccountBalance(accountId: string) {
  const result = await db.accountTransaction.aggregate({
    where: { accountId },
    _sum: { amount: true },
  });

  await db.account.update({
    where: { id: accountId },
    data: { currentBalance: result._sum.amount ?? 0 },
  });
}

/**
 * The opening-date rule: an account's OPENING must fall strictly before every
 * other transaction on that account.
 *
 * Stated from both sides it is the same invariant — an opening cannot be dated
 * after an existing transaction, and a transaction cannot be dated before the
 * opening — so both are checked here rather than in two places that could drift.
 *
 * `excludeTransactionId` is the row being edited: it must not be compared
 * against itself, or moving an opening earlier would fail on its own old date.
 *
 * Returns an error message, or null when the write is legal.
 */
export async function checkOpeningDateInvariant({
  accountId,
  type,
  dateTime,
  excludeTransactionId,
}: {
  accountId: string;
  type: string;
  dateTime: Date | string;
  excludeTransactionId?: string;
}): Promise<string | null> {
  const when = dateTime instanceof Date ? dateTime : new Date(dateTime);
  const notSelf = excludeTransactionId
    ? { id: { not: excludeTransactionId } }
    : {};

  if (type === "OPENING") {
    const earliest = await db.accountTransaction.findFirst({
      where: { accountId, type: { not: "OPENING" }, ...notSelf },
      orderBy: { dateTime: "asc" },
      select: { dateTime: true },
    });

    if (earliest && when >= earliest.dateTime) {
      return `The opening balance must be dated before the account's earliest transaction (${earliest.dateTime.toISOString()}).`;
    }
    return null;
  }

  const opening = await db.accountTransaction.findFirst({
    where: { accountId, type: "OPENING", ...notSelf },
    select: { dateTime: true },
  });

  if (opening && when <= opening.dateTime) {
    return `A transaction cannot be dated before the account's opening balance (${opening.dateTime.toISOString()}).`;
  }
  return null;
}

export async function getAccount(id: string) {
  const account = await db.account.findUnique({
    where: {
      id,
    },
  });
  if (!account) return null;
  return {
    ...account,
    currentBalance: toNumber(account.currentBalance),
  };
}

export async function getAccountTransactionBalanceBefore(
  id: string,
  beforeDate: Date,
): Promise<number> {
  const result = await db.accountTransaction.aggregate({
    where: {
      accountId: id,
      dateTime: { lt: beforeDate },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount ?? new Prisma.Decimal(0));
}

export async function getAccountTransactions(
  id: string,
  year: number | null = null,
) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      accountId: id,
      dateTime: buildDateTimeFilter(year),
    },
    orderBy: {
      dateTime: "asc",
    },
    include: {
      taxLines: true,
    },
  });
  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    foreignCurrencyAmount: toNumber(t.foreignCurrencyAmount),
    foreignCurrencyExchangeRate: toNumber(t.foreignCurrencyExchangeRate),
    location: (t.location as TransactionLocation | null) ?? null,
    taxLines: t.taxLines.map((tl) => ({
      ...tl,
      rate: toNumber(tl.rate),
      amount: toNumber(tl.amount),
      taxAmount: toNumber(tl.taxAmount),
    })),
  }));
}
