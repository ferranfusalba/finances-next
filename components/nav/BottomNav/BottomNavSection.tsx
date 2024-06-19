"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Section } from "@/components/nav/BottomNav/BottomNav";

export default function BottomNavSection({ section }: { section: Section }) {
  const pathname = usePathname();

  const isActive = section.path === pathname;

  return (
    <Link href={section.path}>
      <li
        className={cn(
          "flex items-center justify-center gap-2 md:px-6 flex-col md:flex-row h-full",
          { "bg-white text-stone-900": isActive }
        )}
      >
        <div className="self-center">{section.icon}</div>
        <span className="text-xs md:text-base">{section.name}</span>
      </li>
    </Link>
  );
}
