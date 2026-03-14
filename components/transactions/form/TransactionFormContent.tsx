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
  const form = useFormContext();
  const { userTransactionCategories } = useTransactionUser();

  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedSubcategory = useWatch({ control: form.control, name: "subcategory" });

  const categoryMatch = userTransactionCategories?.find(
    (cat) => cat.name === watchedCategory,
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
    if (variant !== "account") return;
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
  }, [watchedCategory, watchedSubcategory, presetRecurring, form, variant]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      <div className="space-y-4">
        {variant === "account" && <TransactionFormPayeeField />}
        <TransactionFormBasicFields variant={variant} account={account} hasOpeningTransaction={hasOpeningTransaction} isTransferDestination={isTransferDestination} transferOriginAccountId={transferOriginAccountId} />
        <TransactionFormDateTimeFields />
      </div>
      <div className="space-y-4">
        <TransactionFormCategoryFields variant={variant} />
        {variant === "account" && (
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
        )}
        <TransactionFormForeignCurrencyFields accountCurrency={currency} />
        <TransactionFormMetadataFields />
        {variant === "account" && <TransactionFormTaxFields />}
      </div>
    </div>
  );
}
