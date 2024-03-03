import { Account } from "@/types/Account";
import SectionNavMenuListItem from "./SectionNavMenuListItem";

export default function SectionNavMenuList({
  accountList,
}: {
  accountList: Array<Account>;
}) {
  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {accountList.map((account, index) => (
          <SectionNavMenuListItem
            account={account}
            index={index}
            key={account.id}
          ></SectionNavMenuListItem>
        ))}
      </ol>
    </>
  );
}
