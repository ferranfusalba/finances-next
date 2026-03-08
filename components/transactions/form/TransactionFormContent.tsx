"use client";

import TransactionFormPayeeField from "@/components/transactions/form/TransactionFormPayeeField";
import TransactionFormBasicFields from "@/components/transactions/form/TransactionFormBasicFields";
import TransactionFormDateTimeFields from "@/components/transactions/form/TransactionFormDateTimeFields";
import TransactionFormCategoryFields from "@/components/transactions/form/TransactionFormCategoryFields";
import TransactionFormForeignCurrencyFields from "@/components/transactions/form/TransactionFormForeignCurrencyFields";
import TransactionFormMetadataFields from "@/components/transactions/form/TransactionFormMetadataFields";
import TransactionFormTaxFields from "@/components/transactions/form/TransactionFormTaxFields";

import { Account } from "@/types/Account";

interface Props {
  variant: "account" | "budget";
  account?: Account | null;
  defaultCurrency?: string;
  hasOpeningTransaction?: boolean;
  isTransferDestination?: boolean;
  transferOriginAccountId?: string;
}

export default function TransactionFormContent({
  variant,
  account,
  defaultCurrency,
  hasOpeningTransaction,
  isTransferDestination,
  transferOriginAccountId,
}: Props) {
  const currency = account?.defaultCurrency ?? defaultCurrency;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <div className="space-y-4">
        {variant === "account" && <TransactionFormPayeeField />}
        <TransactionFormBasicFields variant={variant} account={account} hasOpeningTransaction={hasOpeningTransaction} isTransferDestination={isTransferDestination} transferOriginAccountId={transferOriginAccountId} />
        <TransactionFormDateTimeFields />
      </div>
      <div className="space-y-4">
        <TransactionFormCategoryFields variant={variant} />
        <TransactionFormForeignCurrencyFields accountCurrency={currency} />
        <TransactionFormMetadataFields />
        {variant === "account" && <TransactionFormTaxFields />}
      </div>
    </div>
  );
}
