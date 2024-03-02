import { db } from "@/lib/db";
import DeleteBudget from "@/components/budgets/delete/DeleteBudget";
import { BudgetParamsProps } from "@/types/Budget";
import LevelClient from "@/components/TabBar/LevelClient";

async function loadBudget({ params }: BudgetParamsProps) {
  return await db.budget.findUnique({
    where: {
      id: params.id,
    },
  });
}

export default async function BudgetLayout({ params }: BudgetParamsProps) {
  const budget = await loadBudget({ params });

  return (
    <>
      <ol>
        <li>Budget id (params): {params.id}</li>
        <li>Budget id (budget): {budget?.id}</li>
        <li>Budget name: {budget?.name}</li>
        <li>Budget active: {budget?.active?.toString()}</li>
        <li>Budget type: {budget?.type?.toString()}</li>
        <li>Budget description: {budget?.description}</li>
        <li>Budget initialBalance: {budget?.initialBalance?.toString()}</li>
        <li>Budget createdAt: {budget?.createdAt.toString()}</li>
        <li>Budget updatedAt: {budget?.updatedAt.toString()}</li>
      </ol>
      <DeleteBudget params={params} />
      <LevelClient />
    </>
  );
}
