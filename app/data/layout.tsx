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
      {/* TODO: Solve this TS error */}
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
