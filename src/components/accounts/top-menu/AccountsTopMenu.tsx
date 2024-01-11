import Link from "next/link";
import { prisma } from "@/libs/prisma";
import { AddAlt } from "@carbon/icons-react";
import { auth } from "@/auth";
import getUserId from "@/utils/getUserId";
import AccountsTopMenuList from "./list/AccountsTopMenuList";

// async function loadAccounts() {
//   return await prisma.account.findMany();
// }

// async function loadUserAccounts(userId: string) {
//   return await prisma.account.findMany({
//     where: {
//       id: userId,
//     },
//   });
// }

export default async function AccountsTopMenu() {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  // const userAccounts = await loadUserAccounts(userId?.id as string);
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
        {/* <AccountsTopMenuList accountList={userAccounts} /> */}
      </nav>
    </>
  );
}
