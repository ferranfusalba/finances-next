import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/libs/prisma";

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
          {accounts.map((account) => (
            <li key={account.id}>
              <Link href={"/accounts/" + account.id}>Account {account.id}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
