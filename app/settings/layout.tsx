import type { Metadata } from "next";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

export const metadata: Metadata = {
  title: "Settings | Finances Next",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultSettings = [
    { id: "user", name: "User" },
    { id: "admin", name: "Admin" },
    { id: "server", name: "Server" },
    { id: "client", name: "Client" },
  ];

  return (
    <>
      <SectionNavMenu type="settings" list={defaultSettings} allowAdd={false} />
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
