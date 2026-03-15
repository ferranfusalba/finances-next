import DeleteBudget from "@/components/budgets/delete/DeleteBudget";
import BudgetTransactionAdd from "@/components/budgets/tables/transactions/BudgetTransactionAdd";
import BudgetTransactionTable from "@/components/budgets/tables/transactions/BudgetTransactionTable";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import Layout02a from "@/components/layouts/Layout02a";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";

import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getBudget, getBudgetTransactions } from "@/lib/budgets";
import { currency } from "@/lib/utils";
import { getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";
import { parseYearParam } from "@/lib/utils/yearFilter";
import { getUserForeignCurrencies, getUserTransactionLocations, getUserTransactionTags } from "@/lib/user";

import { TransactionUserProvider } from "@/contexts/TransactionUserContext";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export default async function BudgetLayout({
  params,
  searchParams,
}: AccountBudgetParamsProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const year = parseYearParam(resolvedSearchParams.year as string | undefined);

  const [budget, serverSession] = await Promise.all([
    getBudget(id),
    auth(),
  ]);

  if (!budget) {
    notFound();
  }

  const userId = serverSession?.user?.id as string;
  const userLocale = serverSession?.user?.userLocale ?? "en-US";

  const [
    budgetTransactions,
    userForeignCurrencies,
    userTransactionLocations,
    userTransactionTags,
  ] = await Promise.all([
    getBudgetTransactions(budget.id, year),
    getUserForeignCurrencies(userId),
    getUserTransactionLocations(userId),
    getUserTransactionTags(userId),
  ]);

  const color0 = getCurrencyColor0(budget.defaultCurrency) ?? "";
  const color1 = getCurrencyColor1(budget.defaultCurrency) ?? "";

  return (
    <Layout02a>
      <LayoutAccountBudgetHeader>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center"></div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <div>
            <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
              {budget.code}
            </span>
            <span> </span>
            <span>{budget.name}</span>
          </div>
          <div>
            <BackgroundChip
              data={budget.defaultCurrency}
              backgroundColor={color0}
              textColor={color1}
            />
            <span> </span>
            <span>{budget.type}</span>
            <span> </span>

            <BorderChip
              data={currency(userLocale, budget.defaultCurrency).format(
                budget.currentBalance
              )}
              borderColor={color0}
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteBudget id={id} />
        </div>
      </LayoutAccountBudgetHeader>
      <TransactionUserProvider
        value={{
          userId,
          userLocale,
          userTimezone: serverSession?.user?.userTimezone ?? "",
          userAccounts: [],
          userTransactionPayees: [],
          userTransactionCategories: [],
          userDefaultTaxRate: 21,
          userForeignCurrencies,
          userTransactionLocations,
          userTransactionTags,
          hasTransactions: budgetTransactions.length > 0,
        }}
      >
        <LayoutAccountBudgetActions>
          <BudgetTransactionAdd budget={budget} />
        </LayoutAccountBudgetActions>
        <LayoutAccountBudgetTable>
          <BudgetTransactionTable
            budgetTransactions={budgetTransactions}
          />
        </LayoutAccountBudgetTable>
      </TransactionUserProvider>
    </Layout02a>
  );
}
