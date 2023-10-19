import Link from "next/link";

import {
  Home,
  TableBuilt,
  Currency,
  ChartLineData,
  Settings,
} from "@carbon/icons-react";

type Section = {
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

function TabBarSection({ section }: { section: Section }) {
  return (
    <Link href={section.path}>
      <li className="flex content-center gap-2 pr-6">
        <div className="self-center">{section.icon}</div>
        {section.name}
      </li>
    </Link>
  );
}

export default function TabBar() {
  return (
    <nav className="bg-slate-900 px-6 py-3 text-white">
      <ul className="flex justify-start">
        {routes.map((route) => {
          return <TabBarSection key={route.path} section={route} />;
        })}
      </ul>
    </nav>
  );
}
