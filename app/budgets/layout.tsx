import type { Metadata } from "next";

import { auth } from "@/auth";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

import { db } from "@/lib/db";

import getUserId from "@/utils/getUserId";

export const metadata: Metadata = {
  title: "Budgets | Finances Next",
};

async function loadUserBudgets(userId: string) {
  return await db.budget.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userBudgets = await loadUserBudgets(userId?.id as string);

  return (
    <>
      <SectionNavMenu type="budgets" list={userBudgets} allowAdd={true} />
      {/* TODO: Solve this TS error */}
      <Layout01>{children}</Layout01>
    </>
  );
}
