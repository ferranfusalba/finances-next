import Link from "next/link";

import { Section } from "@/components/nav/BottomNav/BottomNav";

export default function BottomNavSection({ section }: { section: Section }) {
  return (
    <Link href={section.path}>
      <li className="flex content-center gap-2 md:pr-6 flex-col md:flex-row">
        <div className="self-center">{section.icon}</div>
        <span className="text-xs md:text-base">{section.name}</span>
      </li>
    </Link>
  );
}
