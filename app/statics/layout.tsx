import type { Metadata } from "next";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

export const metadata: Metadata = {
  title: "Statics | Finances Next",
};

export default async function StaticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = [
    { id: "countries", name: "Countries" },
    { id: "currencies", name: "Currencies" },
    { id: "timezones", name: "Timezones" },
  ];

  return (
    <>
      <SectionNavMenu type="statics" list={sections} />
      <Layout01>{children}</Layout01>
    </>
  );
}
