import AccountsTopMenu from "@/components/nav/SectionNav/SectionNavMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AccountsTopMenu />
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
