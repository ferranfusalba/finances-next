import type { Metadata } from "next";
import BudgetsTopMenu from "@/components/budgets/top-menu/BudgetsTopMenu";

export const metadata: Metadata = {
  title: "Budgets | Finances Next",
};

export default async function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BudgetsTopMenu />
      {/* TODO: Solve this TS error */}
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
