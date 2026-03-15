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
      id: "salaries",
      name: "Salaries",
    },
    {
      id: "recurring-payments",
      name: "Recurring Payments",
    },
    {
      id: "sales-tax",
      name: "Sales Tax",
    },
  ];

  return (
    <>
      <SectionNavMenu type="data" list={defaultData} />
      <Layout01>{children}</Layout01>
    </>
  );
}
