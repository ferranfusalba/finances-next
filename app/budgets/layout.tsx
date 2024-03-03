import type { Metadata } from "next";
import { auth } from "@/auth";
import getUserId from "@/utils/getUserId";
import { db } from "@/lib/db";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

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
      <SectionNavMenu type="budgets" list={userBudgets} />
      {/* TODO: Solve this TS error */}
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
