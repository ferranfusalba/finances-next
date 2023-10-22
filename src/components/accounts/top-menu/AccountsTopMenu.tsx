import Link from "next/link";
import AccountMenuItem from "@/components/accounts/top-menu/item/AccountsTopMenuItem";
import { prisma } from "@/libs/prisma";
import { AddAlt } from "@carbon/icons-react";
import { authConfig } from "@/libs/auth";
import { getServerSession } from "next-auth";

// async function loadAccounts() {
//   return await prisma.account.findMany();
// }

async function getUserId(userEmail: any) {
  return await prisma.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}

async function loadUserAccounts(userId: any) {
  return await prisma.account.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function AccountsTopMenu() {
  const session = await getServerSession(authConfig);
  const userEmail = session?.user?.email;
  const userId = await getUserId(userEmail);
  const userAccounts = await loadUserAccounts(userId?.id);
  // const accounts = await loadAccounts();
  return (
    <>
      <nav className="flex bg-sky-900">
        <ul>
          <Link href="/accounts/new">
            <li className="border-2 border-white flex justify-center items-center mr-2.5 w-11 h-11">
              <AddAlt />
            </li>
          </Link>
        </ul>
        <ul className="flex overflow-auto flex-nowrap scroll-touch">
          {userAccounts.map((account) => (
            <AccountMenuItem key={account?.id} account={account} />
          ))}
        </ul>
      </nav>
    </>
  );
}
