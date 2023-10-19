"use client";
import Link from "next/link";

export default function AccountMenuItem({ account }: { account: any }) {
  return (
    <li
      key={account.id}
      className="border-2 border-white flex justify-center items-center min-w-10rem mx-2.5"
    >
      <Link href={"/accounts/" + account.id}>Account {account.id}</Link>{" "}
    </li>
  );
}
