"use client";

// Next
import Link from "next/link";
import { usePathname } from "next/navigation";

// Carbon
import {
  Home,
  TableBuilt,
  Currency,
  ChartLineData,
  Settings,
} from "@carbon/icons-react";

type TabBarSectionProps = {
  link: TabBarLinkData
}

const icons = { Home, TableBuilt, Currency, ChartLineData, Settings };

const TabBarSection = ({ link }: TabBarSectionProps) => {
  const pathname = usePathname();
  let isActive = false;

  if (pathname === link.link) {
    isActive = true;
  }

  const Icon = icons[link.icon];
  return (
    <Link href={link.link} className="w-full flex justify-center items-center tab-bar-section">
      <Icon
        size={14}
      />
      {link.label}
    </Link>
  );
};

export default TabBarSection;