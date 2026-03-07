import { auth } from "@/auth";

import NewAccountForm from "@/components/accounts/new/Form";
import Layout02a from "@/components/layouts/Layout02a";

import { getAccounts } from "@/lib/accounts";
import getUser from "@/lib/user";
import { getUniqueAccountTypes } from "@/lib/utils/accountTypes";

import { User } from "@/types/User";

export default async function NewAccount() {
  const serverSession = await auth();

  const userEmail = serverSession?.user?.email as string;
  const userId = serverSession?.user?.id as string;
  const [user, accounts] = await Promise.all([
    getUser(userEmail),
    getAccounts(userId),
  ]);
  const accountTypes = getUniqueAccountTypes(accounts);

  return (
    <Layout02a>
      <h2 className="text-center py-6">New Account</h2>
      <NewAccountForm user={user as User} accountTypes={accountTypes} />
    </Layout02a>
  );
}
