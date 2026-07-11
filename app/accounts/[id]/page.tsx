import { notFound } from "next/navigation";

import { auth } from "@/auth";

import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import AccountTransactionCollapseToggle from "@/components/accounts/tables/transactions/AccountTransactionCollapseToggle";
import AccountTransactionDownload from "@/components/accounts/tables/transactions/AccountTransactionDownload";

import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import EditAccount from "@/components/accounts/edit/EditAccount";
import BorderChip from "@/components/chips/BorderChip";
import LayoutAccountHeader from "@/components/layouts/account/LayoutAccountHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  getAccounts,
  getAccount,
  getAccountTransactions,
  getAccountTransactionBalanceBefore,
} from "@/lib/accounts";
import { parseYearParam } from "@/lib/utils/yearFilter";
import { currency } from "@/lib/utils";
import { getUniqueAccountTypes } from "@/lib/utils/accountTypes";
import { getCurrencyColors } from "@/lib/utils/currency";
import CurrencyTag from "@/components/chips/CurrencyTag";

import { AccountParamsProps } from "@/types/AccountParams";
import {
  getUserDefaultTaxRate,
  getUserForeignCurrencies,
  getUserTransactionCategories,
  getUserTransactionLocations,
  getUserTransactionPayees,
  getUserTransactionTags,
} from "@/lib/user";
import { CollapseMonthsProvider } from "@/contexts/CollapseMonthsContext";
import { TransactionUserProvider } from "@/contexts/TransactionUserContext";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function AccountLayout({
  params,
  searchParams,
}: AccountParamsProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const year = parseYearParam(resolvedSearchParams.year as string | undefined);

  const [account, serverSession] = await Promise.all([getAccount(id), auth()]);

  const userId = serverSession?.user?.id as string;

  if (!account || account.userId !== userId) {
    notFound();
  }
  const userLocale = serverSession?.user?.userLocale ?? "en-US";

  const [
    accountTransactions,
    userAccounts,
    userTransactionPayees,
    userTransactionCategories,
    userForeignCurrencies,
    userTransactionLocations,
    userTransactionTags,
    userDefaultTaxRate,
    carryForwardBalance,
  ] = await Promise.all([
    getAccountTransactions(account.id, year),
    getAccounts(userId),
    getUserTransactionPayees(userId),
    getUserTransactionCategories(userId),
    getUserForeignCurrencies(userId),
    getUserTransactionLocations(userId),
    getUserTransactionTags(userId),
    getUserDefaultTaxRate(userId),
    year
      ? getAccountTransactionBalanceBefore(
          account.id,
          new Date(`${year}-01-01T00:00:00.000Z`),
        )
      : Promise.resolve(0),
  ]);

  return (
    <>
      <Layout02a1>
        <LayoutAccountHeader>
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
              <span className="font-mono">{account.number}</span>
            </div>
            <div>
              <CurrencyTag code={account.defaultCurrency} />
              <span> </span>
              <span>{account.type}</span>
              <span> </span>
              <BorderChip
                data={currency(userLocale, account.defaultCurrency).format(
                  account.currentBalance,
                )}
                borderColor={getCurrencyColors(account.defaultCurrency)?.[0] ?? ""}
              />
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 grid justify-center content-center gap-2">
            <EditAccount
              account={account}
              accountTypes={getUniqueAccountTypes(userAccounts)}
            />
            <DeleteAccount id={id} />
          </div>
        </LayoutAccountHeader>
      </Layout02a1>
      <TransactionUserProvider
        value={{
          userId,
          userLocale,
          userTimezone: serverSession?.user?.userTimezone ?? "",
          userAccounts,
          userTransactionPayees,
          userTransactionCategories: userTransactionCategories.map((cat) => ({
            ...cat,
            defaultTaxRate:
              cat.defaultTaxRate != null
                ? Number(String(cat.defaultTaxRate))
                : null,
            subcategories: cat.subcategories.map((sub) => ({
              ...sub,
              defaultTaxRate:
                sub.defaultTaxRate != null
                  ? Number(String(sub.defaultTaxRate))
                  : null,
            })),
          })),
          userDefaultTaxRate,
          userForeignCurrencies,
          userTransactionLocations,
          userTransactionTags,
          hasTransactions: accountTransactions.length > 0,
        }}
      >
        <CollapseMonthsProvider>
          <Layout02a1>
            <div className="flex flex-col sm:flex-row gap-2 py-2">
              <AccountTransactionAdd
                account={account}
                accountTransactions={accountTransactions}
                hasOpeningTransaction={accountTransactions.some(
                  (t) => t.type === "OPENING",
                )}
              />
              <AccountTransactionDownload
                accountTransactions={accountTransactions}
                accountName={account.name}
              />
              <AccountTransactionCollapseToggle
                accountTransactions={accountTransactions}
              />
            </div>
          </Layout02a1>

          <div className="flex flex-col gap-2 pb-20 w-full">
            <AccountTransactionTable
              accountTransactions={accountTransactions}
              account={account}
              carryForwardBalance={carryForwardBalance}
            />
          </div>
        </CollapseMonthsProvider>
      </TransactionUserProvider>
    </>
  );
}
