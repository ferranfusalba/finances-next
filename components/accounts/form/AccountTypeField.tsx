"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import { ACCOUNT_TYPES } from "@/schemas";

/**
 * Account type is a fixed enum, not free text. Only INVESTMENT changes
 * behaviour (it accepts RETURN / WITHHOLDING / ROUNDING rows, so its balance
 * tracks market value); the rest behave identically to one another.
 */
const LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CASH: "Cash",
  PREPAID: "Prepaid",
  INVESTMENT: "Investment",
};

const DESCRIPTIONS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  CHECKING: "Day-to-day current account",
  SAVINGS: "Interest-bearing deposit",
  CASH: "Physical cash",
  PREPAID: "Restricted, employer-funded balance",
  INVESTMENT: "Brokerage, fund or wallet — records returns and retenciones",
};

const options: ComboboxOption[] = ACCOUNT_TYPES.map((type) => ({
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
            {value in DESCRIPTIONS && (
              <p className="text-muted-foreground mt-1 text-xs select-none">
                {DESCRIPTIONS[value as keyof typeof DESCRIPTIONS]}
              </p>
            )}
            <FormMessage aria-live="polite" />
          </FormItem>
        );
      }}
    />
  );
}
