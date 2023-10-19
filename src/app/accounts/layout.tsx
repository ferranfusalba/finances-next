import type { Metadata } from "next";
import AccountsTopMenu from "@/components/accounts/top-menu/AccountsTopMenu";

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
