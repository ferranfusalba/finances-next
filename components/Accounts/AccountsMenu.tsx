import Link from "next/link";
import AccountCard from "@/components/Accounts/AccountCard";
import NewAccount from "@/components/Accounts/NewAccount";

type AccountsMenuProps = {
  accounts: [];
};

const AccountsMenu = ({ accounts }: AccountsMenuProps) => {
  return (
    <div className="account-menu">
      <div className="account-add">
        <NewAccount />
      </div>
      <div className="account-scroll">
        {accounts.map((account) => (
            <div key={account.id}>
            <Link href={`/account/${account.id}`}>
                <AccountCard project={account} />
            </Link>
            </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsMenu;
