import type { Metadata } from "next";

import { auth } from "@/auth";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

import { getAccounts } from "@/lib/accounts";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverSession = await auth();
  const userAccounts = await getAccounts(serverSession?.user.id as string);

  return (
    <>
      {/* @ts-ignore: Async Server Component TypeScript Error */}
      <SectionNavMenu type="accounts" list={userAccounts} allowAdd />
      <Layout01>{children}</Layout01>
    </>
  );
}
