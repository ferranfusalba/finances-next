import { auth } from "@/auth";

import NewAccountForm from "@/components/accounts/new/Form";

import { User } from "@/types/User";

import getUserId from "@/utils/getUserId";

export default async function NewAccount() {
  const session = await auth();
  const userEmail = session?.user?.email as string;

  const userId = await getUserId(userEmail);

  return (
    <div className="pb-20">
      <h2 className="text-center py-6">New Account</h2>
      <NewAccountForm userId={userId as User} />
    </div>
  );
}
