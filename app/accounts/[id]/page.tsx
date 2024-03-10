import { db } from "@/lib/db";
import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import ZustandClient from "@/components/accounts/tables/transactions/ZustandClient";
import Layout02a from "@/components/layouts/Layout02a";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";
import { AccountBudgetParamsProps } from "@/types/AccountBudget";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import { cn, currency } from "@/lib/utils";
import currencies from "@/statics/currencies.json";
import { Currency } from "@/types/Currency";

async function loadAccount({ params }: AccountBudgetParamsProps) {
  return await db.account.findUnique({
    where: {
      id: params.id,
    },
  });
}

async function loadAccountTransactions(id: string) {
  return await db.accountTransaction.findMany({
    where: {
      accountId: id,
    },
  });
}

export default async function AccountLayout({
  params,
}: AccountBudgetParamsProps) {
  const account = await loadAccount({ params });
  const accountId = account!.id;
  const accountCode = account!.code;
  const accountTransactions = await loadAccountTransactions(accountId);
  const currenciesList = Object.values(currencies);
  const defaultCurrency: Currency | undefined = currenciesList.find(
    (currency) => currency.code === account?.defaultCurrency
  );
  // TODO: Fix this undefined (fallback object ?)
  const backgroundColor = defaultCurrency
    ? defaultCurrency.backgroundColor
    : "";
  const textColor = defaultCurrency ? defaultCurrency.textColor : "";

  return (
    <Layout02a>
      <LayoutAccountBudgetHeader>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <Avatar>
            {/* TODO: Build image & bankCode matchers */}
            {/* <AvatarImage src="https://images.unsplash.com/photo-1708022792768-edfab8b2be7a?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" /> */}
            <AvatarFallback>{account?.bankName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <span className="text-2xl">{account?.bankName}</span>
          <div>
            <span className="font-mono p-1 bg-slate-100 v rounded-md text-stone-900">
              {account?.code}
            </span>
            <span> </span>
            <span>{account?.name}</span>
          </div>
          <div>
            <span
              className={cn(
                backgroundColor,
                textColor,
                "font-mono p-1 v rounded-md"
              )}
            >
              {account?.defaultCurrency}
            </span>
            <span> </span>
            <span>{account?.type}</span>
            <span> </span>
            <span className="font-mono">
              {currency("ca-AD", account!.defaultCurrency).format(
                account?.currentBalance as number
              )}
            </span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteAccount params={params} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <ZustandClient></ZustandClient>
        <AccountTransactionAdd
          account={account}
          accountId={accountId}
          accountCode={accountCode}
        />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <AccountTransactionTable accountTransactions={accountTransactions} />
      </LayoutAccountBudgetTable>
    </Layout02a>
  );
}
