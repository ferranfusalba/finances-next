"use client";
import { Account } from "@/types/Account";
import Link from "next/link";

export default function AccountMenuItem({ account }: { account: Account }) {
  return (
    <li
      key={account.id}
      className="border-2 border-white flex justify-center items-center mx-2.5 px-4"
    >
      <Link
        className="w-max min-w-10rem text-center"
        href={"/accounts/" + account.id}
      >
        {account.name}
      </Link>{" "}
    </li>
  );
}
