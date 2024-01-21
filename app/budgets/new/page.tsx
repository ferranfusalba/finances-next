import NewBudgetForm from "@/components/budgets/new/Form";
import { User } from "@/types/User";
import getUserId from "@/utils/getUserId";
import { auth } from "@/auth";

export default async function NewBudget() {
  const session = await auth();
  const userEmail = session?.user?.email as string;

  const userId = await getUserId(userEmail);

  return (
    <>
      New Budget
      <NewBudgetForm userId={userId as User} />
    </>
  );
}
