import type { Metadata } from "next";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

export const metadata: Metadata = {
  title: "Settings | Finances Next",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultSettings = [{ id: "user", name: "User" }];

  return (
    <>
      <SectionNavMenu type="settings" list={defaultSettings} />
      <Layout01>{children}</Layout01>
    </>
  );
}
