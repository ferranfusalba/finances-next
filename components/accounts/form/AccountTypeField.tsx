"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import {
  SELECTABLE_ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS as LABELS,
} from "@/lib/utils/account";

/**
 * Account type is a fixed enum, not free text, and it decides which transaction
 * types the account may hold (see allowedTransactionTypes). It is set once at
 * creation and is immutable thereafter — hence this field only appears on the
 * new-account form.
 *
 * INVESTMENT_LEGACY is absent from the options: it exists only to keep the
 * pre-split accounts working, and offering it would let you create new accounts
 * in the model we are retiring.
 */
const options: ComboboxOption[] = SELECTABLE_ACCOUNT_TYPES.map((type) => ({
  value: type,
  label: LABELS[type],
}));

export default function AccountTypeField() {
  const form = useFormContext();

  return (
    <Controller
      control={form.control}
      name="type"
      render={({ field: controllerField }) => {
        const value = controllerField.value as string;

        return (
          <FormItem>
            <FormLabel>Account Type*</FormLabel>
            <Combobox
              options={options}
              value={value || ""}
              onValueChange={controllerField.onChange}
              placeholder="Select an account type"
              searchPlaceholder="Search account types..."
              emptyText="No account types found."
            />
            <FormMessage aria-live="polite" />
          </FormItem>
        );
      }}
    />
  );
}
