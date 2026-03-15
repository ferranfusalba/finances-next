import { notFound } from "next/navigation";

import { auth } from "@/auth";

import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import AccountTransactionCollapseToggle from "@/components/accounts/tables/transactions/AccountTransactionCollapseToggle";
import AccountTransactionDownload from "@/components/accounts/tables/transactions/AccountTransactionDownload";
import AccountTransactionExpandable from "@/components/accounts/tables/transactions/AccountTransactionExpandable";

import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import EditAccount from "@/components/accounts/edit/EditAccount";
import BackgroundChip from "@/components/chips/BackgroundChip";
import BorderChip from "@/components/chips/BorderChip";
import LayoutAccountBudgetHeader from "@/components/layouts/account-budget/LayoutAccountBudgetHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  getAccounts,
  getAccount,
  getAccountTransactions,
} from "@/lib/accounts";
import { currency } from "@/lib/utils";
import { getUniqueAccountTypes } from "@/lib/utils/accountTypes";
import { getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";
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
}: AccountBudgetParamsProps) {
  const { id } = await params;

  const [account, serverSession] = await Promise.all([getAccount(id), auth()]);

  if (!account) {
    notFound();
  }

  const userId = serverSession?.user?.id as string;
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
  ] = await Promise.all([
    getAccountTransactions(account.id),
    getAccounts(userId),
    getUserTransactionPayees(userId),
    getUserTransactionCategories(userId),
    getUserForeignCurrencies(userId),
    getUserTransactionLocations(userId),
    getUserTransactionTags(userId),
    getUserDefaultTaxRate(userId),
  ]);

  return (
    <>
      <Layout02a1>
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
              <span className="font-mono">{account.number}</span>
            </div>
            <div>
              <BackgroundChip
                data={account.defaultCurrency}
                backgroundColor={
                  getCurrencyColor0(account.defaultCurrency) ?? ""
                }
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
          <div className="col-span-2 md:col-span-1 grid justify-center content-center gap-2">
            <EditAccount
              account={account}
              accountTypes={getUniqueAccountTypes(userAccounts)}
            />
            <DeleteAccount id={id} />
          </div>
        </LayoutAccountBudgetHeader>
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
          <AccountTransactionExpandable
            actions={
              <>
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
              </>
            }
          >
            <AccountTransactionTable
              accountTransactions={accountTransactions}
              account={account}
            />
          </AccountTransactionExpandable>
        </CollapseMonthsProvider>
      </TransactionUserProvider>
    </>
  );
}
