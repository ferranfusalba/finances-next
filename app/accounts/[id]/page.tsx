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
import { Currency } from "@/types/Currency";
import { currenciesList } from "@/utils/getCurrenciesList";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import countries from "@/statics/countries.json";

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
  const accountTransactions = await loadAccountTransactions(accountId);
  const defaultCurrencyMatch: Currency | undefined = currenciesList.find(
    (currency) => currency.code === account?.defaultCurrency
  );
  // TODO: Fix this undefined (fallback object ?)
  const color0 = defaultCurrencyMatch ? defaultCurrencyMatch.color0 : "";
  const color1 = defaultCurrencyMatch ? defaultCurrencyMatch.color1 : "";

  function getCountryEmojiFlag(alpha2Code: string) {
    const country = countries.filter(
      (country) => country["alpha-2"] === alpha2Code
    )[0];
    if (country) {
      return country["emoji-flag"] || "No emoji flag available";
    } else {
      return "Country not found";
    }
  }

  function getCountryName(alpha2Code: string) {
    const country = countries.filter(
      (country) => country["alpha-2"] === alpha2Code
    )[0];
    if (country) {
      return country["name"] || "No country name available";
    } else {
      return "Country not found";
    }
  }

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
              {getCountryEmojiFlag(account?.country as string)}
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
              backgroundColor={color0 as string}
              textColor={color1 as string}
            />
            <span> </span>
            <span>{account?.type}</span>
            <span> </span>
            <BorderChip
              data={currency("ca-AD", account!.defaultCurrency).format(
                account?.currentBalance as number
              )}
              borderColor={color0 as string}
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteAccount params={params} />
        </div>
      </LayoutAccountBudgetHeader>
      <LayoutAccountBudgetActions>
        <ZustandClient></ZustandClient>
        <AccountTransactionAdd account={account} />
      </LayoutAccountBudgetActions>
      <LayoutAccountBudgetTable>
        <AccountTransactionTable accountTransactions={accountTransactions} />
      </LayoutAccountBudgetTable>
    </Layout02a>
  );
}
