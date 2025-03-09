import type { Metadata } from "next";

import Layout01 from "@/components/layouts/Layout01";
import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";

export const metadata: Metadata = {
  title: "Playground | Finances Next",
};

export default async function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultPlayground = [
    { id: "playground-client", name: "Playground (Client)" },
    { id: "playground-server", name: "Playground (Server)" },
  ];

  return (
    <>
      <SectionNavMenu type="playground" list={defaultPlayground} />
      <Layout01>{children}</Layout01>
    </>
  );
}
