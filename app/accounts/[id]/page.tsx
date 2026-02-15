import { notFound } from "next/navigation";

import { auth } from "@/auth";

import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import AccountTransactionDownload from "@/components/accounts/tables/transactions/AccountTransactionDownload";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import Layout02a from "@/components/layouts/Layout02a";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import LayoutAccountBudgetActions from "@/components/layouts/account-budget/LayoutAccountBudgetActions";
import LayoutAccountBudgetTable from "@/components/layouts/account-budget/LayoutAccountBudgetTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
import {
  getUserForeignCurrencies,
  getUserTransactionCategories,
  getUserTransactionLocations,
  getUserTransactionPayees,
} from "@/lib/user";

export default async function AccountLayout({
  params,
}: AccountBudgetParamsProps) {
  const { id } = await params;
  const account = await getAccount(id);

  if (!account) {
    notFound();
  }

  const accountTransactions = await getAccountTransactions(account.id);

  const serverSession = await auth();
  const userLocale = serverSession?.user?.userLocale ?? "en-US";
  const userAccounts = await getAccounts(serverSession?.user?.id as string);
  const userTransactionPayees = await getUserTransactionPayees(
    serverSession?.user.id as string,
  );
  const userTransactionCategories = await getUserTransactionCategories(
    serverSession?.user.id as string,
  );
  const userForeignCurrencies = await getUserForeignCurrencies(
    serverSession?.user.id as string,
  );
  const userTransactionLocations = await getUserTransactionLocations(
    serverSession?.user.id as string,
  );

  function getCountryFullName(alpha2Code: string) {
    const country = countries.filter(
      (country) => country["alpha-2"] === alpha2Code,
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
            <AvatarFallback>{account.bankName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <span className="text-2xl">{account.bankName}</span>
          <div>
            <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
              {account.code}
            </span>
            <span> </span>
            <span>{account.name}</span>
          </div>
          <div>
            <span>
              {getCountryFlag(account.country)}
              {"  "}
              {account.country} - {getCountryName(account.country)}{" "}
              {getCountryFullName(account.country)}
            </span>
            <span> - </span>
            <span className="font-mono">{account.number}</span>
          </div>
          <div>
            <BackgroundChip
              data={account.defaultCurrency}
              backgroundColor={getCurrencyColor0(account.defaultCurrency) ?? ""}
              textColor={getCurrencyColor1(account.defaultCurrency) ?? ""}
            />
            <span> </span>
            <span>{account.type}</span>
            <span> </span>
            <BorderChip
              data={currency(userLocale, account.defaultCurrency).format(
                account.currentBalance,
              )}
              borderColor={getCurrencyColor0(account.defaultCurrency) ?? ""}
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteAccount id={id} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <AccountTransactionAdd
          account={account}
          userAccounts={userAccounts}
          userTransactionPayees={userTransactionPayees}
          userTransactionCategories={userTransactionCategories}
          userId={serverSession?.user?.id ?? ""}
          userTimezone={serverSession?.user?.userTimezone ?? ""}
          userForeignCurrencies={userForeignCurrencies}
          userTransactionLocations={userTransactionLocations}
          hasTransactions={accountTransactions.length > 0}
        />
        <AccountTransactionDownload
          accountTransactions={accountTransactions}
          accountName={account.name}
        />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <AccountTransactionTable
          accountTransactions={accountTransactions}
          userLocale={userLocale}
          account={account}
          userAccounts={userAccounts}
          userTransactionPayees={userTransactionPayees}
          userTransactionCategories={userTransactionCategories}
          userId={serverSession?.user?.id ?? ""}
          userTimezone={serverSession?.user?.userTimezone ?? ""}
          userForeignCurrencies={userForeignCurrencies}
          userTransactionLocations={userTransactionLocations}
          hasTransactions={accountTransactions.length > 0}
        />
      </LayoutAccountBudgetTable>
    </Layout02a>
  );
}
