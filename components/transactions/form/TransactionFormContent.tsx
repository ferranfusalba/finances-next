"use client";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TransactionFormPayeeField from "@/components/transactions/form/TransactionFormPayeeField";
import TransactionFormBasicFields from "@/components/transactions/form/TransactionFormBasicFields";
import TransactionFormDateTimeFields from "@/components/transactions/form/TransactionFormDateTimeFields";
import TransactionFormCategoryFields from "@/components/transactions/form/TransactionFormCategoryFields";
import TransactionFormForeignCurrencyFields from "@/components/transactions/form/TransactionFormForeignCurrencyFields";
import TransactionFormMetadataFields from "@/components/transactions/form/TransactionFormMetadataFields";
import TransactionFormTaxFields from "@/components/transactions/form/TransactionFormTaxFields";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { transactionTypeToCategoryType } from "@/lib/utils/categoryType";
import { transactionBucket } from "@/lib/utils/transaction";

import { Account } from "@/types/Account";

interface Props {
  account?: Account | null;
  defaultCurrency?: string;
  hasOpeningTransaction?: boolean;
  isTransferDestination?: boolean;
  transferOriginAccountId?: string;
}

export default function TransactionFormContent({
  account,
  defaultCurrency,
  hasOpeningTransaction,
  isTransferDestination,
  transferOriginAccountId,
}: Props) {
  const currency = account?.defaultCurrency ?? defaultCurrency;
  const form = useFormContext();
  const { userTransactionCategories } = useTransactionUser();

  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedSubcategory = useWatch({ control: form.control, name: "subcategory" });
  const watchedType = useWatch({ control: form.control, name: "type" });
  const categoryType = transactionTypeToCategoryType(watchedType ?? "");

  const categoryMatch = userTransactionCategories?.find(
    (cat) => cat.name === watchedCategory && cat.type === categoryType,
  );
  const subcategoryMatch = categoryMatch?.subcategories?.find(
    (sub) => sub.name === watchedSubcategory,
  );

  // Resolution: subcategory > category
  const presetRecurring =
    subcategoryMatch?.recurring != null
      ? subcategoryMatch.recurring
      : categoryMatch?.recurring ?? null;

  const isInitialMount = useRef(true);
  const prevCategory = useRef(watchedCategory);
  const prevSubcategory = useRef(watchedSubcategory);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCategory.current = watchedCategory;
      prevSubcategory.current = watchedSubcategory;
      return;
    }
    if (
      watchedCategory === prevCategory.current &&
      watchedSubcategory === prevSubcategory.current
    ) return;
    prevCategory.current = watchedCategory;
    prevSubcategory.current = watchedSubcategory;
    form.setValue("recurring", presetRecurring ?? "");
  }, [watchedCategory, watchedSubcategory, presetRecurring, form]);

  // RETURN / WITHHOLDING / ROUNDING describe the account's own performance, not
  // a purchase. Payee, category, tags, location, recurring and tax lines are all
  // meaningless on them — a market movement has no shop and no VAT. The fields
  // stay in the schema (they back the Locations page, tag search, CSV export and
  // the sales-tax report for ordinary transactions); they are simply not shown
  // here.
  const isPerformanceRow = transactionBucket(watchedType ?? "") !== "CONTRIBUTION";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <div className="space-y-4">
        {!isPerformanceRow && <TransactionFormPayeeField />}
        <TransactionFormBasicFields account={account} hasOpeningTransaction={hasOpeningTransaction} isTransferDestination={isTransferDestination} transferOriginAccountId={transferOriginAccountId} />
        <TransactionFormDateTimeFields />
      </div>
      <div className="space-y-4">
        {!isPerformanceRow && (
          <>
            <TransactionFormCategoryFields />
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurring</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val === "NONE" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Not recurring" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">Not recurring</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </>
        )}
        <TransactionFormForeignCurrencyFields accountCurrency={currency} />
        {!isPerformanceRow && (
          <>
            <TransactionFormMetadataFields />
            <TransactionFormTaxFields />
          </>
        )}
      </div>
    </div>
  );
}
