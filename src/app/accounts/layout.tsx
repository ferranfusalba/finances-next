import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="nav-accounts">
        <ul>
          <li>
            <Link href="/accounts/1">Account 1</Link>
          </li>
          <li>
            <Link href="/accounts/2">Account 2</Link>
          </li>
        </ul>
      </nav>
      {children}
    </>
  );
}
