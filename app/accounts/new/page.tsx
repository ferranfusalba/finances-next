import { auth } from "@/auth";

import NewAccountForm from "@/components/accounts/new/Form";
import Layout02a from "@/components/layouts/Layout02a";

import { getAccounts } from "@/lib/accounts";
import getUser from "@/lib/user";

export default async function NewAccount() {
  const serverSession = await auth();

  const userEmail = serverSession?.user?.email as string;
  const userId = serverSession?.user?.id as string;
  const [user, accounts] = await Promise.all([
    getUser(userEmail),
    getAccounts(userId),
  ]);

  return (
    <Layout02a>
      <h2 className="text-center py-6">New Account</h2>
      <NewAccountForm
        defaultCurrency={user?.userCurrency || ""}
      />
    </Layout02a>
  );
}
