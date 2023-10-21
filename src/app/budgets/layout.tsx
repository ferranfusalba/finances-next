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
      <main className="h-full-main">{children}</main>
    </>
  );
}
