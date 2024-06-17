import type { Metadata } from "next";

import Layout01 from "@/components/layouts/Layout01";
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
      {/* @ts-ignore: Async Server Component TypeScript Error */}
      <SectionNavMenu type="data" list={defaultData} />
      <Layout01>{children}</Layout01>
    </>
  );
}
