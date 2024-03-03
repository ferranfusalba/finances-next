import { Account } from "@/types/Account";
import AccountsTopMenuListItem from "./SectionNavMenuListItem";

export default function AccountsTopMenuList({
  accountList,
}: {
  accountList: Array<Account>;
}) {
  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {accountList.map((account, index) => (
          <AccountsTopMenuListItem
            account={account}
            index={index}
            key={account.id}
          ></AccountsTopMenuListItem>
        ))}
      </ol>
    </>
  );
}
