"use client";

import { WarningAlt } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";
import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";

import { Account } from "@/types/Account";
import { AccountTransaction } from "@/types/Transaction";

interface Props {
  account: Account;
  accountTransactions: AccountTransaction[];
}

/**
 * Shown when an account has no OPENING transaction.
 *
 * New accounts always get one at creation, so this only fires for accounts that
 * predate that rule. We deliberately do not backfill them with a zero: an
 * account's real starting balance is not something we can infer, and inventing
 * one would quietly restate its whole history. So we ask instead.
 *
 * It sits above the table rather than inside it because "this account has no
 * opening" is a fact about the account, not a row — and a first-row banner would
 * have to answer awkward questions about sorting and pagination.
 */
export default function AccountOpeningBanner({
  account,
  accountTransactions,
}: Props) {
  const hasOpening = accountTransactions.some((t) => t.type === "OPENING");

  if (hasOpening) return null;

  const hasTransactions = accountTransactions.length > 0;

  return (
    <div className="border-warning/40 bg-warning/10 mb-4 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <WarningAlt className="mt-0.5 shrink-0" size={20} />
        <div className="space-y-1">
          <p className="text-sm font-medium select-none">
            This account has no opening balance
          </p>
          <p className="text-muted-foreground text-xs select-none">
            {hasTransactions
              ? "Its balance is being computed from its transactions alone, as if it started from zero. Set what it actually held when your records begin — the date must fall before its earliest transaction."
              : "Set what it held when your records begin, so its balance starts from the right figure."}
          </p>
        </div>
      </div>
      <AccountTransactionAdd
        account={account}
        accountTransactions={accountTransactions}
        defaultType="OPENING"
        trigger={
          <Button variant="outline" className="shrink-0 select-none">
            Set opening balance
          </Button>
        }
      />
    </div>
  );
}
