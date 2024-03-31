import type { Metadata } from "next";

import { auth } from "@/auth";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

import getUserId from "@/utils/getUserId";
import getUserAccounts from "@/utils/getUserAccounts";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userAccounts = await getUserAccounts(userId?.id as string);

  return (
    <>
      <SectionNavMenu type="accounts" list={userAccounts} allowAdd={true} />
      {/* TODO: Solve this TS error */}
      <Layout01>{children}</Layout01>
    </>
  );
}
