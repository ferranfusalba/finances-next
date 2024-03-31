import type { Metadata } from "next";

import { auth } from "@/auth";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

import getUserId from "@/utils/getUserId";
import getUserBudgets from "@/utils/getUserBudgets";

export const metadata: Metadata = {
  title: "Budgets | Finances Next",
};

export default async function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userBudgets = await getUserBudgets(userId?.id as string);

  return (
    <>
      <SectionNavMenu type="budgets" list={userBudgets} allowAdd={true} />
      {/* TODO: Solve this TS error */}
      <Layout01>{children}</Layout01>
    </>
  );
}
