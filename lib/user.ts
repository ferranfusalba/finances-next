import { db } from "@/lib/db";

export default async function getUser(userEmail: string) {
  return await db.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}
