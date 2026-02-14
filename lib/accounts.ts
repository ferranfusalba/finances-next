import { db } from "@/lib/db";

export async function getAccounts(userId: string) {
  return await db.account.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      order: "asc",
    },
  });
}

export async function getAccount(id: string) {
  return await db.account.findUnique({
    where: {
      id,
    },
  });
}

export async function getAccountTransactions(id: string) {
  return await db.accountTransaction.findMany({
    where: {
      accountId: id,
    },
    orderBy: {
      dateTime: "asc",
    },
  });
}
