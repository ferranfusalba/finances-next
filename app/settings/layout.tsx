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
  const defaultSettings = [
    { id: "user", name: "User" },
    { id: "admin", name: "Admin" },
    { id: "server", name: "Server" },
    { id: "client", name: "Client" },
    { id: "playground-client", name: "Playground (Client)" },
    { id: "playground-server", name: "Playground (Server)" },
  ];

  return (
    <>
      <SectionNavMenu type="settings" list={defaultSettings} allowAdd={false} />
      <Layout01>{children}</Layout01>
    </>
  );
}
