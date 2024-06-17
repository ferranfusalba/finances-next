import { auth } from "@/auth";

import { getAccounts } from "@/lib/accounts";

import AccountsOverviewTable from "@/components/accounts/tables/overview/AccountsOverviewTable";

export default async function AccountsPage() {
  const serverSession = await auth();
  const userAccounts = await getAccounts(serverSession?.user.id as string);

  return (
    <div className="w-full h-full p-4 md:p-8">
      <AccountsOverviewTable accounts={userAccounts} />
    </div>
  );
}
