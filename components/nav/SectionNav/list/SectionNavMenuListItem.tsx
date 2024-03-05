"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SectionNavMenuListItem({
  item,
  index,
  type,
}: {
  item: { id: string; name: string };
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
          "border-2 border-white flex justify-center items-center mx-2.5 px-4 h-11",
          { "bg-neutral-50 text-sky-900": accountSelected },
          { "bg-neutral-50 text-pink-900": budgetSelected },
          { "bg-neutral-50 text-lime-900": dataSelected },
          { "bg-neutral-50 text-stone-900": settingsSelected }
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
