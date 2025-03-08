"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function SectionNavMenuListItem({
  item,
  index,
  type,
}: {
  item: { id: string; name: string; bankName?: string };
  index: number;
  type: string;
}) {
  const pathname = usePathname();
  const accountSelected = "/accounts/" + item.id === pathname;
  const budgetSelected = "/budgets/" + item.id === pathname;
  const dataSelected = "/data/" + item.id === pathname;
  const settingsSelected = "/settings/" + item.id === pathname;

  return (
    <>
      <li
        key={index}
        className={cn(
          "border-2 border-white text-white flex justify-center items-center mx-2.5 px-4 h-11",
          {
            "bg-black border-black text-white dark:bg-white dark:border-white dark:text-sky-900":
              accountSelected,
          },
          {
            "bg-black border-black text-white dark:bg-white dark:border-white dark:text-pink-900":
              budgetSelected,
          },
          {
            "bg-black border-black text-white dark:bg-white dark:border-white dark:text-lime-900":
              dataSelected,
          },
          {
            "bg-black border-black text-white dark:bg-white dark:border-white dark:text-stone-900":
              settingsSelected,
          }
        )}
      >
        <Link
          className="w-max min-w-10rem text-center"
          href={`/${type}/` + item.id}
        >
          {item.bankName ? (
            <>
              <small>{item.bankName}</small> · {item.name}
            </>
          ) : (
            item.name
          )}
        </Link>
      </li>
    </>
  );
}
