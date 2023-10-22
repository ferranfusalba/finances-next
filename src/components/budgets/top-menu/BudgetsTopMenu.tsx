import Link from "next/link";
import BudgetsTopMenuItem from "@/components/budgets/top-menu/item/BudgetsTopMenuItem";
import { prisma } from "@/libs/prisma";
import { AddAlt } from "@carbon/icons-react";
import { authConfig } from "@/libs/auth";
import { getServerSession } from "next-auth";

// async function loadBudgets() {
//   return await prisma.budget.findMany();
// }

async function getUserId(userEmail: any) {
  return await prisma.user.findFirst({
    where: {
      email: userEmail,
    },
  });
}

async function loadUserBudgets(userId: any) {
  return await prisma.budget.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function BudgetsTopMenu() {
  const session = await getServerSession(authConfig);
  const userEmail = session?.user?.email;
  const userId = await getUserId(userEmail);
  const userBudgets = await loadUserBudgets(userId?.id);
  // const budgets = await loadBudgets();
  return (
    <>
      <nav className="flex bg-pink-900">
        <ul>
          <Link href="/budgets/new">
            <li className="border-2 border-white flex justify-center items-center mr-2.5 w-11 h-11">
              <AddAlt />
            </li>
          </Link>
        </ul>
        <ul className="flex overflow-auto flex-nowrap scroll-touch">
          {userBudgets.map((budget) => (
            <BudgetsTopMenuItem key={budget.id} budget={budget} />
          ))}
        </ul>
      </nav>
    </>
  );
}
