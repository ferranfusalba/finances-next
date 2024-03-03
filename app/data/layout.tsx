import type { Metadata } from "next";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

export const metadata: Metadata = {
  title: "Data | Finances Next",
};

export default async function DataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultData = [
    {
      id: "asset-allocation",
      name: "Asset Allocation",
    },
    {
      id: "entities-allocation",
      name: "Financial Entities Allocation",
    },
    {
      id: "salaries",
      name: "Salaries",
    },
    {
      id: "subscriptions",
      name: "Subscriptions",
    },
    {
      id: "income-expenses-year",
      name: "Income & Expenses 2024",
    },
    {
      id: "income-expenses",
      name: "Income & Expenses Inception",
    },
    {
      id: "net-worth-year",
      name: "Net Worth 2024",
    },
    {
      id: "net-worth",
      name: "Net Worth Inception",
    },
  ];

  return (
    <>
      <SectionNavMenu type="data" list={defaultData} allowAdd={false} />
      {/* TODO: Solve this TS error */}
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
