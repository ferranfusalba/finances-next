import {
  Home,
  TableBuilt,
  Currency,
  ChartLineData,
  Settings,
} from "@carbon/icons-react";

import BottomNavSection from "@/components/nav/BottomNav/BottomNavSection";

export interface Section {
  path: string;
  name: string;
  icon: React.ReactNode;
}

const routes: Array<Section> = [
  { path: "/", name: "Home", icon: <Home /> },
  {
    path: "/accounts",
    name: "Accounts",
    icon: <Currency />,
  },
  { path: "/budgets", name: "Budgets", icon: <TableBuilt /> },
  { path: "/data", name: "Data", icon: <ChartLineData /> },
  { path: "/settings", name: "Settings", icon: <Settings /> },
];

export default function BottomNav() {
  return (
    <nav className="h-16 md:h-12 items-center text-white bg-zinc-950 border-t border-t-gray-400 shadow-gray-400">
      <ul className="grid grid-cols-5 md:flex w-full h-full">
        {routes.map((route) => {
          return <BottomNavSection key={route.path} section={route} />;
        })}
      </ul>
    </nav>
  );
}
