"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Section } from "@/components/nav/BottomNav/BottomNav";

export default function BottomNavSection({ section }: { section: Section }) {
  const pathname = usePathname();

  const isActive =
    section.name !== "Home" ? pathname.includes(section.path) : null;
  const isHomeActive = pathname === section.path;

  const active = isActive || isHomeActive;

  return (
    <li
      className={cn(
        "flex items-center justify-center gap-2 md:px-6 flex-col md:flex-row h-full",
        {
          "bg-black text-white dark:bg-white dark:text-black": active,
        }
      )}
    >
      <Link
        href={section.path}
        aria-current={active ? "page" : undefined}
        className="flex items-center justify-center gap-2 flex-col md:flex-row w-full h-full"
      >
        <div className="self-center">{section.icon}</div>
        <span className="text-xs md:text-base">{section.name}</span>
      </Link>
    </li>
  );
}
