import SectionNavMenuAdd from "@/components/nav/SectionNav/SectionNavMenuAdd";
import SectionNavMenuList from "@/components/nav/SectionNav/list/SectionNavMenuList";

import { cn } from "@/lib/utils";

export default async function SectionNavMenu({
  type,
  list,
  allowAdd = false,
}: {
  type: string;
  allowAdd?: boolean;
  list: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <nav
        className={cn(
          "flex fixed top-16 w-full z-10",
          { "bg-sky-900": type === "accounts" },
          { "bg-pink-900": type === "budgets" },
          { "bg-lime-900": type === "data" },
          { "bg-stone-900": type === "settings" },
          { "bg-fuchsia-900": type === "playground" }
        )}
      >
        {allowAdd && (
          <ul>
            <SectionNavMenuAdd type={type} />
          </ul>
        )}
        <SectionNavMenuList list={list} type={type} />
      </nav>
    </>
  );
}
