import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/libs/prisma";
import AccountMenuItem from "@/components/AccountMenuItem/AccountMenuItem";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

async function loadAccounts() {
  return await prisma.account.findMany();
}

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accounts = await loadAccounts();

  return (
    <>
      <nav className="nav-accounts">
        <ul>
          <Link href="/accounts/new">New Account</Link>
        </ul>
        <ul>
          {accounts.map((account) => (
            <AccountMenuItem key={account.id} account={account} />
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
