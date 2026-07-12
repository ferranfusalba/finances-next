import AccountTransactionTable from "@/components/accounts/tables/transactions/AccountTransactionTable";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import AccountOpeningBanner from "@/components/accounts/tables/transactions/AccountOpeningBanner";
import AccountTransactionCollapseToggle from "@/components/accounts/tables/transactions/AccountTransactionCollapseToggle";
import AccountTransactionDownload from "@/components/accounts/tables/transactions/AccountTransactionDownload";
import BorderChip from "@/components/chips/BorderChip";
import Layout02a1 from "@/components/layouts/Layout02a1";

import { currency } from "@/lib/utils";
import { getCurrencyColors } from "@/lib/utils/currency";

import { Account } from "@/types/Account";
import { AccountTransaction } from "@/types/Transaction";

interface Props {
  account: Account;
  accountTransactions: AccountTransaction[];
  carryForwardBalance: number;
  userLocale: string;
  /**
   * What this ledger is a leg *of* — "Invested" or "Cash".
   *
   * Passed only when the page shows more than one, and it names the leg rather
   * than the account: on an investment page the account name ("Fondos") already
   * titles the page, and repeating it over the first table would leave the two
   * tables reading asymmetrically — one named after the whole thing, one named
   * "Cash". The legs are peers, so they are labelled as peers.
   */
  legLabel?: string;
  /**
   * "column" packs the whole ledger into one self-contained block so it can sit
   * in a grid cell beside its sibling leg. "full" keeps the original page shape:
   * a centred toolbar above an edge-to-edge table.
   */
  variant?: "full" | "column";
}

/**
 * One account's ledger: toolbar, missing-opening banner, transactions table.
 *
 * Rendered once for a plain account, and once per leg for an investment pair —
 * the invested account and its cash child appear side by side, which is what the
 * provider actually shows you.
 */
export default function AccountLedgerSection({
  account,
  accountTransactions,
  carryForwardBalance,
  userLocale,
  legLabel,
  variant = "full",
}: Props) {
  const heading = legLabel ? (
    <div className="flex flex-wrap items-center gap-2 pt-6">
      <h3 className="text-lg font-medium select-none">{legLabel}</h3>
      <BorderChip
        data={currency(userLocale, account.defaultCurrency).format(
          account.currentBalance,
        )}
        borderColor={getCurrencyColors(account.defaultCurrency)?.[0] ?? ""}
      />
    </div>
  ) : null;

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-2 py-2">
      <AccountTransactionAdd
        account={account}
        accountTransactions={accountTransactions}
      />
      <AccountTransactionDownload
        accountTransactions={accountTransactions}
        accountName={account.name}
      />
      <AccountTransactionCollapseToggle
        accountTransactions={accountTransactions}
      />
    </div>
  );

  const ledger = (
    <>
      <AccountOpeningBanner
        account={account}
        accountTransactions={accountTransactions}
      />
      <AccountTransactionTable
        accountTransactions={accountTransactions}
        account={account}
        carryForwardBalance={carryForwardBalance}
      />
    </>
  );

  if (variant === "column") {
    // min-w-0 is load-bearing: a grid item defaults to min-content width, and the
    // transactions table is far wider than half a screen. Without it the column
    // refuses to shrink and the two legs blow the page out sideways instead of
    // each scrolling within its own half.
    return (
      <section className="flex min-w-0 flex-col gap-2">
        {heading}
        {toolbar}
        {ledger}
      </section>
    );
  }

  return (
    <>
      <Layout02a1>
        {heading}
        {toolbar}
      </Layout02a1>
      <div className="flex flex-col gap-2 pb-10 w-full">{ledger}</div>
    </>
  );
}
