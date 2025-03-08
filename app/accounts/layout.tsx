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

  // Temporary sort by order until order reassignation by drag&drop is applied
  const userAccountsSortOrder = userAccounts.sort(function (a, b) {
    if (a.order > b.order) {
      return 1;
    }

    if (a.order < b.order) {
      return -1;
    }

    return 0;
  });

  return (
    <>
      <SectionNavMenu type="accounts" list={userAccountsSortOrder} allowAdd />
      <Layout01>{children}</Layout01>
    </>
  );
}
