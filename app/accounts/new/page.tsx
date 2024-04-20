import { auth } from "@/auth";

import NewAccountForm from "@/components/accounts/new/Form";

import getUser from "@/lib/user";

import { User } from "@/types/User";

export default async function NewAccount() {
  const serverSession = await auth();

  const userEmail = serverSession?.user?.email as string;
  const user = await getUser(userEmail);

  return (
    <div className="pb-20">
      <h2 className="text-center py-6">New Account</h2>
      <NewAccountForm user={user as User} />
    </div>
  );
}
