// Next
import Image from "next/image";

// Components
import Card from "@/components/Card";
import TabBarSection from "@/components/TabBar/TabBarSection";

export type TabBarLinkData = {
  label: string,
  icon: string,
  link: string
}

const links:TabBarLinkData[] = [
  {
    label: "Home",
    icon: "Home",
    link: "/"
  },
  {
    label: "Budget",
    icon: "TableBuilt",
    link: "/budget",
  },
  { label: "Accounts",
    icon: "Currency",
    link: "/accounts"
  },
  { label: "Data",
    icon: "ChartLineData",
    link: "/data"
  },
  {
    label: "Settings",
    icon: "Settings",
    link: "/settings",
  },
];

const TabBar = () => {
  return (
    <div className="w-full flex flex-row tab-bar">
      {links.map((link) => (
        <TabBarSection key={link} link={link} />
      ))}
    </div>
  );
};

export default TabBar;
