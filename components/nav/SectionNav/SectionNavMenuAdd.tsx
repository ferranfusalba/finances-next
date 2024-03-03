"use client";
import Link from "next/link";
import { AddAlt } from "@carbon/icons-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SectionNavMenuAdd() {
  const pathname = usePathname();
  const newAccountSelected = pathname === "/accounts/new";

  return (
    <>
      <Link href="/accounts/new">
        <li
          className={cn(
            "border-2 border-white flex justify-center items-center mr-2.5 w-11 h-11",
            { "bg-neutral-50 text-sky-900": newAccountSelected }
          )}
        >
          <AddAlt />
        </li>
      </Link>
    </>
  );
}
