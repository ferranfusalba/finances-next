"use client";
import { Account } from "@/types/Account";
import { Budget } from "@/types/Budget";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SectionNavMenuListItem({
  item,
  index,
  type,
}: {
  item: Account | Budget;
  index: number;
  type: string;
}) {
  const pathname = usePathname();
  const accountSelected = "/accounts/" + item.id === pathname;
  const budgetSelected = "/budgets/" + item.id === pathname;

  return (
    <>
      <li
        key={index}
        className={cn(
          "border-2 border-white flex justify-center items-center mx-2.5 px-4",
          { "bg-neutral-50 text-sky-900": accountSelected },
          { "bg-neutral-50 text-pink-900": budgetSelected }
        )}
      >
        <Link
          className="w-max min-w-10rem text-center"
          href={`/${type}/` + item.id}
        >
          {item.name}
        </Link>{" "}
      </li>
    </>
  );
}
