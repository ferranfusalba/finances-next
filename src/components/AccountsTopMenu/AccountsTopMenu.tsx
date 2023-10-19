import Link from "next/link";
import AccountMenuItem from "@/components/AccountMenuItem/AccountMenuItem";
import { prisma } from "@/libs/prisma";
import { AddAlt } from "@carbon/icons-react";

async function loadAccounts() {
  return await prisma.account.findMany();
}

export default async function AccountsTopMenu() {
  const accounts = await loadAccounts();
  return (
    <>
      <nav className="accounts-nav">
        <ul className="static-element">
          <Link href="/accounts/new">
            <li className="add-account-element">
              <AddAlt />
            </li>
          </Link>
        </ul>
        <ul className="dynamic-elements">
          {accounts.map((account) => (
            <AccountMenuItem key={account.id} account={account} />
          ))}
        </ul>
      </nav>
    </>
  );
}
