"use client";
import Link from "next/link";

export default function AccountMenuItem({ account }: { account: any }) {
  return (
    <li key={account.id} className="list-item-element">
      <Link href={"/accounts/" + account.id}>Account {account.id}</Link>{" "}
    </li>
  );
}
