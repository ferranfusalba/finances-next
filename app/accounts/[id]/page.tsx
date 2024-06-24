import { auth } from "@/auth";

import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import Layout02a from "@/components/layouts/Layout02a";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  getAccounts,
  getAccount,
  getAccountTransactions,
} from "@/lib/accounts";
import { currency } from "@/lib/utils";
import { getCountryFlag, getCountryName } from "@/lib/utils/country";
import { getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";

import countries from "@/statics/countries.json";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export default async function AccountLayout({
  params,
}: AccountBudgetParamsProps) {
  const account = await getAccount({ params });
  const accountTransactions = await getAccountTransactions(
    account?.id as string
  );

  const serverSession = await auth();
  const userAccounts = await getAccounts(serverSession?.user?.id as string);

  function getCountryFullName(alpha2Code: string) {
    const country = countries.filter(
      (country) => country["alpha-2"] === alpha2Code
    )[0];
    if (country && country["full-name"]) {
      return "(" + country["full-name"] + ")";
    } else if (country) {
      return "";
    } else {
      return "Country not found";
    }
  }

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
            <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
              {account?.code}
            </span>
            <span> </span>
            <span>{account?.name}</span>
          </div>
          <div>
            <span>
              {getCountryFlag(account?.country as string)}
              {"  "}
              {account?.country} - {getCountryName(account?.country as string)}{" "}
              {getCountryFullName(account?.country as string)}
            </span>
            <span> - </span>
            <span className="font-mono">{account?.number}</span>
          </div>
          <div>
            <BackgroundChip
              data={account?.defaultCurrency as string}
              backgroundColor={
                getCurrencyColor0(account?.defaultCurrency as string) as string
              }
              textColor={
                getCurrencyColor1(account?.defaultCurrency as string) as string
              }
            />
            <span> </span>
            <span>{account?.type}</span>
            <span> </span>
            <BorderChip
              data={currency("ca-AD", account!.defaultCurrency).format(
                account?.currentBalance as number
              )}
              borderColor={
                getCurrencyColor0(account?.defaultCurrency as string) as string
              }
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteAccount params={params} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <AccountTransactionAdd account={account} userAccounts={userAccounts} />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <AccountTransactionTable accountTransactions={accountTransactions} />
      </LayoutAccountBudgetTable>
    </Layout02a>
  );
}
