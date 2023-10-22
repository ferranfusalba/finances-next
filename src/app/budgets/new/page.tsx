import NewBudgetForm from "@/components/budgets/new/Form";
import { authConfig } from "@/libs/auth";
import { User } from "@/types/User";
import getUserId from "@/utils/getUserId";
import { getServerSession } from "next-auth";

export default async function NewBudget() {
  const session = await getServerSession(authConfig);
  const userEmail = session?.user?.email as string;

  const userId = await getUserId(userEmail);

  return (
    <>
      New Budget
      <NewBudgetForm userId={userId as User} />
    </>
  );
}
