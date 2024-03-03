import SectionNavMenuList from "./list/SectionNavMenuList";
import SectionNavMenuAdd from "./SectionNavMenuAdd";
import { Account } from "@/types/Account";
import { Budget } from "@/types/Budget";
import { cn } from "@/lib/utils";

export default async function SectionNavMenu({
  type,
  list,
  allowAdd,
}: {
  type: string;
  allowAdd: boolean;
  list: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <nav
        className={cn(
          "flex fixed top-16 w-full z-10",
          { "bg-sky-900": type === "accounts" },
          { "bg-pink-900": type === "budgets" },
          { "bg-lime-900": type === "data" }
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
