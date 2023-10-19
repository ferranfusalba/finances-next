import type { Metadata } from "next";
import AccountsTopMenu from "@/components/AccountsTopMenu/AccountsTopMenu";

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
      {children}
    </>
  );
}
