import NewAccountForm from "@/components/accounts/new/Form";
import { User } from "@/types/User";
import getUserId from "@/utils/getUserId";
import { auth } from "@/auth";

export default async function NewAccount() {
  const session = await auth();
  const userEmail = session?.user?.email as string;

  const userId = await getUserId(userEmail);

  return (
    <>
      New Account
      <NewAccountForm userId={userId as User} />
    </>
  );
}
