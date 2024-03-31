import { db } from "@/lib/db";

export default async function getUserBudgets(userId: string) {
  return await db.budget.findMany({
    where: {
      userId: userId,
    },
  });
}
