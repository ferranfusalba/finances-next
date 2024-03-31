import { db } from "@/lib/db";

export default async function getUserAccounts(userId: string) {
  return await db.account.findMany({
    where: {
      userId: userId,
    },
  });
}
