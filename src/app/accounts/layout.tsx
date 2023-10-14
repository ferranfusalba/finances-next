import Link from "next/link";

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="nav-accounts">
        <ul>
          <Link href="/accounts/1">Account 1</Link>
          <Link href="/accounts/2">Account 2</Link>
        </ul>
      </nav>
      {children}
    </>
  );
}
