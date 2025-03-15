import { auth } from "@/auth";

import NewBudgetForm from "@/components/budgets/new/Form";
import Layout02a from "@/components/layouts/Layout02a";

import getUser from "@/lib/user";

import { User } from "@/types/User";

export default async function NewBudget() {
  const serverSession = await auth();

  const userEmail = serverSession?.user?.email as string;
  const user = await getUser(userEmail);

  return (
    <Layout02a>
      <h2 className="text-center py-6">New Budget</h2>
      <NewBudgetForm user={user as User} />
    </Layout02a>
  );
}
