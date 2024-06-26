import DeleteBudget from "@/components/budgets/delete/DeleteBudget";
import BudgetTransactionAdd from "@/components/budgets/tables/transactions/BudgetTransactionAdd";
import BudgetTransactionTable from "@/components/budgets/tables/transactions/BudgetTransactionTable";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import Layout02a from "@/components/layouts/Layout02a";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";

import { getBudget, getBudgetTransactions } from "@/lib/budgets";
import { currency } from "@/lib/utils";

import currencies from "@/statics/currencies.json";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";
import { Currency } from "@/types/Currency";

export default async function BudgetLayout({
  params,
}: AccountBudgetParamsProps) {
  const budget = await getBudget({ params });
  const budgetTransactions = await getBudgetTransactions(budget?.id as string);

  const defaultCurrencyMatch: Currency | undefined = currencies.find(
    (currency) => currency.code === budget?.defaultCurrency
  );
  // TODO: Fix this undefined (fallback object ?)
  const color0 = defaultCurrencyMatch ? defaultCurrencyMatch.color0 : "";
  const color1 = defaultCurrencyMatch ? defaultCurrencyMatch.color1 : "";

  return (
    <Layout02a>
      <LayoutAccountBudgetHeader>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center"></div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <div>
            <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
              {budget?.code}
            </span>
            <span> </span>
            <span>{budget?.name}</span>
          </div>
          <div>
            <BackgroundChip
              data={budget?.defaultCurrency as string}
              backgroundColor={color0 as string}
              textColor={color1 as string}
            />
            <span> </span>
            <span>{budget?.type}</span>
            <span> </span>

            <BorderChip
              data={currency("ca-AD", budget!.defaultCurrency).format(
                budget?.currentBalance as number
              )}
              borderColor={color0 as string}
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteBudget params={params} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <BudgetTransactionAdd budget={budget} />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <BudgetTransactionTable budgetTransactions={budgetTransactions} />
      </LayoutAccountBudgetTable>
    </Layout02a>
  );
}
