import { Account } from "@/types/Account";
import { Budget } from "@/types/Budget";
import SectionNavMenuListItem from "./SectionNavMenuListItem";

export default function SectionNavMenuList({
  list,
  type,
}: {
  list: Array<Account> | Array<Budget>;
  type: string;
}) {
  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {list.map((item, index) => (
          <SectionNavMenuListItem
            item={item}
            index={index}
            key={item.id}
            type={type}
          ></SectionNavMenuListItem>
        ))}
      </ol>
    </>
  );
}
