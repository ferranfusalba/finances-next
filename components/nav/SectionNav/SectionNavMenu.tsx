import Link from "next/link";
import { db } from "@/lib/db";
import { AddAlt } from "@carbon/icons-react";
import { auth } from "@/auth";
import getUserId from "@/utils/getUserId";
import AccountsTopMenuList from "./list/SectionNavMenuList";

async function loadUserAccounts(userId: string) {
  return await db.financialAccount.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function AccountsTopMenu() {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userAccounts = await loadUserAccounts(userId?.id as string);

  return (
    <>
      <nav className="flex bg-sky-900 fixed top-16 w-full z-10">
        <ul>
          <Link href="/accounts/new">
            <li className="border-2 border-white flex justify-center items-center mr-2.5 w-11 h-11">
              <AddAlt />
            </li>
          </Link>
        </ul>
        <AccountsTopMenuList accountList={userAccounts} />
      </nav>
    </>
  );
}
