"use client";

import { AddAlt } from "@carbon/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function SectionNavMenuAdd({ type }: { type: string }) {
  const pathname = usePathname();
  const newAccountSelected = pathname === "/accounts/new";

  return (
    <>
      <Link href={`/${type}/new`}>
        <li
          className={cn(
            "border-2 border-white flex justify-center items-center mr-2.5 w-11 h-11 text-white",
            {
              "bg-black border-black text-white dark:bg-white dark:border-white dark:text-sky-900":
                newAccountSelected,
            }
          )}
        >
          <AddAlt />
        </li>
      </Link>
    </>
  );
}
