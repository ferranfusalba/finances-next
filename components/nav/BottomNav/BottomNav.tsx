import {
  Home,
  TableBuilt,
  Currency,
  ChartLineData,
  Settings,
} from "@carbon/icons-react";
import BottomNavSection from "./BottomNavSection";

export type Section = {
  path: string;
  name: string;
  icon: React.ReactNode;
};

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
    // bg-slate-900
    <nav className="md:flex md:justify-between px-6 py-3 text-white bg-zinc-950 border-t border-t-gray-400 shadow-gray-400">
      <ul className="flex justify-between md:justify-start">
        {routes.map((route) => {
          return <BottomNavSection key={route.path} section={route} />;
        })}
      </ul>
    </nav>
  );
}
