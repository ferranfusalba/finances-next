import { auth } from "@/auth";

import NewBudgetForm from "@/components/budgets/new/Form";

import getUser from "@/lib/user";

import { User } from "@/types/User";

export default async function NewBudget() {
  const serverSession = await auth();

  const userEmail = serverSession?.user?.email as string;
  const user = await getUser(userEmail);

  return (
    <div className="pb-20">
      <h2 className="text-center py-6">New Budget</h2>
      <NewBudgetForm user={user as User} />
    </div>
  );
}
