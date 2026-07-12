import { auth } from "@/auth";

import { getAccountsForList } from "@/lib/accounts";

import AccountsOverviewTable from "@/components/accounts/tables/overview/AccountsOverviewTable";

export default async function AccountsPage() {
  const serverSession = await auth();
  const userLocale = serverSession?.user?.userLocale ?? "en-US";
  const userAccounts = await getAccountsForList(serverSession?.user.id as string);

  if (!userAccounts.length) {
    return (
      <div className="w-full h-full grid justify-center content-center">
        No accounts yet, add a new one
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-8">
      <AccountsOverviewTable
        accounts={userAccounts}
        userLocale={userLocale}
      />
    </div>
  );
}
