import NewAccountForm from "@/components/accounts/new/Form";
import { authConfig } from "@/libs/auth";
import { User } from "@/types/User";
import getUserId from "@/utils/getUserId";
import { getServerSession } from "next-auth";

export default async function NewAccount() {
  const session = await getServerSession(authConfig);
  const userEmail = session?.user?.email as string;

  const userId = await getUserId(userEmail);

  return (
    <>
      New Account
      <NewAccountForm userId={userId as User} />
    </>
  );
}
