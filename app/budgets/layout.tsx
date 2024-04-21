import type { Metadata } from "next";

import { auth } from "@/auth";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

import { getBudgets } from "@/lib/budgets";

export const metadata: Metadata = {
  title: "Budgets | Finances Next",
};

export default async function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverSession = await auth();
  const userBudgets = await getBudgets(serverSession?.user.id as string);

  return (
    <>
      {/* @ts-ignore: Async Server Component TypeScript Error */}
      <SectionNavMenu type="budgets" list={userBudgets} allowAdd={true} />
      <Layout01>{children}</Layout01>
    </>
  );
}
