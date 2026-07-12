import { notFound } from "next/navigation";

import { auth } from "@/auth";

import AccountLedgerSection from "@/components/accounts/tables/transactions/AccountLedgerSection";

import AddCashLeg from "@/components/accounts/cash/AddCashLeg";
import InvestmentBreakdown from "@/components/accounts/investment/InvestmentBreakdown";
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
  getChildAccounts,
  getInvestmentDecomposition,
  rollUpBalance,
} from "@/lib/accounts";
import { parseYearParam } from "@/lib/utils/yearFilter";
import { currency } from "@/lib/utils";
import { getCurrencyColors } from "@/lib/utils/currency";
import CurrencyTag from "@/components/chips/CurrencyTag";

import { AccountParamsProps } from "@/types/AccountParams";
import {
  getUserDefaultTaxRate,
  getUserForeignCurrencies,
  getUserTransactionCategories,
  getUserTransactionPayees,
  getUserTransactionTags,
} from "@/lib/user";
import {
  ACCOUNT_LEG_LABELS,
  ACCOUNT_TYPE_LABELS,
  uniqueBankNames,
} from "@/lib/utils/account";
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
    childAccounts,
    userTransactionPayees,
    userTransactionCategories,
    userForeignCurrencies,
    userTransactionTags,
    userDefaultTaxRate,
    carryForwardBalance,
  ] = await Promise.all([
    getAccountTransactions(account.id, year),
    getAccounts(userId),
    getChildAccounts(account.id),
    getUserTransactionPayees(userId),
    getUserTransactionCategories(userId),
    getUserForeignCurrencies(userId),
    getUserTransactionTags(userId),
    getUserDefaultTaxRate(userId),
    year
      ? getAccountTransactionBalanceBefore(
          account.id,
          new Date(`${year}-01-01T00:00:00.000Z`),
        )
      : Promise.resolve(0),
  ]);

  // An investment provider is two accounts — the invested position and the cash
  // it holds for you — rendered as two tables on one page, because that is how
  // the provider shows it to you.
  const childLedgers = await Promise.all(
    childAccounts.map(async (child) => ({
      account: child,
      accountTransactions: await getAccountTransactions(child.id, year),
      carryForwardBalance: year
        ? await getAccountTransactionBalanceBefore(
            child.id,
            new Date(`${year}-01-01T00:00:00.000Z`),
          )
        : 0,
    })),
  );

  const totalBalance = rollUpBalance(account, childAccounts);
  const hasChildren = childAccounts.length > 0;

  // An investment account may have one cash leg, or none — it is your choice
  // whether your provider's cash is worth tracking separately.
  const canAddCashLeg = account.type === "INVESTMENT" && !hasChildren;

  // The decomposition covers the whole provider — both legs — because that is the
  // figure you reconcile against its statement. It only means anything on an
  // investment: an expense on a checking account has nowhere useful to sit.
  const isInvestment =
    account.type === "INVESTMENT" || account.type === "INVESTMENT_LEGACY";

  const decomposition = isInvestment
    ? await getInvestmentDecomposition([
        account.id,
        ...childAccounts.map((child) => child.id),
      ])
    : null;

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
            <div className="flex flex-wrap items-center gap-2">
              <CurrencyTag code={account.defaultCurrency} />
              <span>{ACCOUNT_TYPE_LABELS[account.type]}</span>
              <BorderChip
                data={currency(userLocale, account.defaultCurrency).format(
                  totalBalance,
                )}
                borderColor={getCurrencyColors(account.defaultCurrency)?.[0] ?? ""}
              />
              {hasChildren && (
                <span className="text-muted-foreground text-xs select-none">
                  invested and cash combined
                </span>
              )}
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 grid justify-center content-center gap-2">
            <EditAccount
              account={account}
              bankNames={uniqueBankNames(userAccounts)}
            />
            <DeleteAccount id={id} />
          </div>
          {/* The cash leg is optional, and it is added from the account it
              belongs to rather than opened from scratch — so the parent is never
              in question. Only offered once, and only where it means something. */}
          {canAddCashLeg && (
            <div className="col-span-12 flex justify-center pt-2">
              <AddCashLeg account={account} />
            </div>
          )}
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
          userTransactionTags,
          hasTransactions: accountTransactions.length > 0,
        }}
      >
        {decomposition && (
          <Layout02a1>
            <div className="py-4">
              <InvestmentBreakdown
                decomposition={decomposition}
                defaultCurrency={account.defaultCurrency}
                userLocale={userLocale}
              />
            </div>
          </Layout02a1>
        )}
        <CollapseMonthsProvider>
          {hasChildren ? (
            // The legs are peers, so they sit side by side. Stacked below 2xl:
            // the transactions table is ~20 columns wide, and half of a narrow
            // screen leaves it scrolling more than it shows.
            //
            // items-start is load-bearing. Grid cells stretch to the row height by
            // default, and the table's own toolbar is wrapped in a `m-auto`
            // container — which, given free vertical space, absorbs it and pushes
            // the shorter leg's table halfway down its column.
            <div className="grid w-full grid-cols-1 items-start gap-6 px-4 pb-20 2xl:grid-cols-2">
              <AccountLedgerSection
                account={account}
                accountTransactions={accountTransactions}
                carryForwardBalance={carryForwardBalance}
                userLocale={userLocale}
                legLabel={ACCOUNT_LEG_LABELS[account.type]}
                variant="column"
              />
              {childLedgers.map((child) => (
                <AccountLedgerSection
                  key={child.account.id}
                  account={child.account}
                  accountTransactions={child.accountTransactions}
                  carryForwardBalance={child.carryForwardBalance}
                  userLocale={userLocale}
                  legLabel={
                    ACCOUNT_LEG_LABELS[child.account.type] ?? child.account.name
                  }
                  variant="column"
                />
              ))}
            </div>
          ) : (
            // A lone account has no leg to distinguish itself from, so no heading
            // and the original full-width shape.
            <AccountLedgerSection
              account={account}
              accountTransactions={accountTransactions}
              carryForwardBalance={carryForwardBalance}
              userLocale={userLocale}
            />
          )}
        </CollapseMonthsProvider>
      </TransactionUserProvider>
    </>
  );
}
