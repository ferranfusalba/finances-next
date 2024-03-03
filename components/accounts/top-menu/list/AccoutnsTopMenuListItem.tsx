"use client";
import { Account } from "@/types/Account";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AccountsTopMenuListItem({
  account,
  index,
}: {
  account: Account;
  index: number;
}) {
  const pathname = usePathname();
  const accountSelected = "/accounts/" + account.id === pathname;

  return (
    <>
      <li
        key={index}
        className={cn(
          "border-2 border-white flex justify-center items-center mx-2.5 px-4",
          { "bg-neutral-50 text-sky-900": accountSelected }
        )}
      >
        <Link
          className="w-max min-w-10rem text-center"
          href={"/accounts/" + account.id}
        >
          {account.name}
        </Link>{" "}
      </li>
    </>
  );
}
