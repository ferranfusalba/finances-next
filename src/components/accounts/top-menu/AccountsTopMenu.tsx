import Link from "next/link";
import AccountMenuItem from "@/components/accounts/top-menu/item/AccountsTopMenuItem";
import { prisma } from "@/libs/prisma";
import { AddAlt } from "@carbon/icons-react";

async function loadAccounts() {
  return await prisma.account.findMany();
}

export default async function AccountsTopMenu() {
  const accounts = await loadAccounts();
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
          {accounts.map((account) => (
            <AccountMenuItem key={account.id} account={account} />
          ))}
        </ul>
      </nav>
    </>
  );
}
