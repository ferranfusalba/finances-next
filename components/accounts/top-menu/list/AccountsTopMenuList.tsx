"use client";
import { Account } from "@/types/Account";
import Link from "next/link";

export default function AccountsTopMenuList({
  accountList,
}: {
  accountList: Array<Account>;
}) {
  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {accountList.map((account, index) => (
          <li
            key={index}
            className="border-2 border-white flex justify-center items-center mx-2.5 px-4"
          >
            <Link
              className="w-max min-w-10rem text-center"
              href={"/accounts/" + account.id}
            >
              {account.name}
            </Link>{" "}
          </li>
        ))}
      </ol>
    </>
  );
}
