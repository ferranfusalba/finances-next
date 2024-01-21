import { db } from "@/lib/db";

export default async function getUserId(userEmail: string) {
  return await db.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}
