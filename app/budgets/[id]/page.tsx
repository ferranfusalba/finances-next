import { db } from "@/lib/db";
import ZustandClient from "@/components/accounts/tables/transactions/ZustandClient";
import DeleteBudget from "@/components/budgets/delete/DeleteBudget";
import LevelClient from "@/components/budgets/LevelClient";
import Layout02 from "@/components/layouts/Layout02";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";
import { AccountBudgetParamsProps } from "@/types/AccountBudget";
import { currency } from "@/lib/utils";
import AddBudgetTransaction from "@/components/budgets/tables/transactions/AddBudgetTransaction";
import BudgetTransactionTable from "@/components/budgets/tables/transactions/BudgetTransactionTable";

async function loadBudget({ params }: AccountBudgetParamsProps) {
  return await db.budget.findUnique({
    where: {
      id: params.id,
    },
  });
}

async function loadBudgetTransactions(id: string) {
  return await db.budgetTransaction.findMany({
    where: {
      budgetId: id,
    },
  });
}

export default async function BudgetLayout({
  params,
}: AccountBudgetParamsProps) {
  const budget = await loadBudget({ params });
  const budgetId = budget!.id;
  const budgetCode = budget!.code;
  const budgetTransactions = await loadBudgetTransactions(budgetId);

  return (
    <Layout02>
      <LayoutAccountBudgetHeader>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center"></div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <div>
            <span className="font-mono p-1 bg-slate-100 v rounded-md text-stone-900">
              {budget?.code}
            </span>
            <span> </span>
            <span>{budget?.name}</span>
          </div>
          <div>
            <span className="font-mono p-1 bg-blue-800 v rounded-md text-amber-300">
              {budget?.defaultCurrency}
            </span>
            <span> </span>
            <span>{budget?.type}</span>
            <span> </span>
            <span className="font-mono">
              {currency("ca-AD", "EUR").format(
                budget?.currentBalance as number
              )}
            </span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteBudget params={params} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <ZustandClient></ZustandClient>
        <AddBudgetTransaction
          budget={budget}
          budgetId={budgetId}
          budgetCode={budgetCode}
        />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <BudgetTransactionTable budgetTransactions={budgetTransactions} />
        <br />
        <LevelClient />
      </LayoutAccountBudgetTable>
    </Layout02>
  );
}
