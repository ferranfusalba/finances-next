import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Finances Next",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row">
      <SettingsSidebar />
      <main>{children}</main>
    </div>
  );
}
