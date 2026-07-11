import { Currency, ChartLineData } from "@carbon/icons-react";

import BottomNavSection from "@/components/nav/BottomNav/BottomNavSection";

export interface Section {
  path: string;
  name: string;
  icon: React.ReactNode;
}

const routes: Array<Section> = [
  {
    path: "/accounts",
    name: "Accounts",
    icon: <Currency />,
  },
  { path: "/data", name: "Data", icon: <ChartLineData /> },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Sections"
      className="h-12 items-center bg-white dark:bg-black border-t border-t-gray-400 shadow-gray-400"
    >
      <ul className="grid grid-cols-2 md:flex w-full h-full">
        {routes.map((route) => {
          return <BottomNavSection key={route.path} section={route} />;
        })}
      </ul>
    </nav>
  );
}
