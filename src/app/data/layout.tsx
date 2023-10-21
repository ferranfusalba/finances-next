import type { Metadata } from "next";
import DataTopMenu from "@/components/data/top-menu/DataTopMenu";

export const metadata: Metadata = {
  title: "Data | Finances Next",
};

export default async function DataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DataTopMenu />
      <main className="h-full-main">{children}</main>
    </>
  );
}
