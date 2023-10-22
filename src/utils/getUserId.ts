import { prisma } from "@/libs/prisma";

export default async function getUserId(userEmail: string) {
  return await prisma.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}
