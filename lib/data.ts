import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

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
