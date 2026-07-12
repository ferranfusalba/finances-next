"use client";

import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import { AddAlt } from "@carbon/icons-react";

import { cn } from "@/lib/utils";

const ADD_NEW_VALUE = "__new__";

interface Props {
  /** Bank names already in use across the user's accounts. */
  bankNames: string[];
}

/**
 * Bank name, picked from the banks you already have accounts with.
 *
 * It was free text, which meant a second account at the same bank was one typo
 * away from being filed under a different one — and the name is what groups
 * accounts in the sidebar and the overview. Adding a new bank is still one
 * click; you just cannot do it by accident.
 *
 * Follows the same shape as the payee field on the transaction form.
 */
export default function BankNameField({ bankNames }: Props) {
  const form = useFormContext();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBankName, setNewBankName] = useState("");

  const hasBanks = bankNames.length > 0;

  const alreadyExists = useMemo(() => {
    if (!isAddingNew || !newBankName.trim()) return false;
    return bankNames.some(
      (name) => name.toLowerCase() === newBankName.trim().toLowerCase(),
    );
  }, [isAddingNew, newBankName, bankNames]);

  const options: ComboboxOption[] = [
    {
      value: ADD_NEW_VALUE,
      label: "Add a new bank",
      icon: <AddAlt className="mr-2 h-4 w-4" />,
    },
    ...bankNames.map((name) => ({ value: name, label: name })),
  ];

  return (
    <Controller
      control={form.control}
      name="bankName"
      render={({ field }) => {
        const value = (field.value as string) ?? "";
        const isKnown = bankNames.includes(value);
        const showingNewInput =
          isAddingNew ||
          // The current value is not in the list — this account already sits
          // under a bank no other account uses. Show it, rather than an empty
          // selector over a non-empty field.
          (!!value && !isKnown) ||
          // Your first account: there is nothing to pick from, so asking you to
          // click "Add a new bank" before you can type is pure ceremony.
          bankNames.length === 0;

        return (
          <FormItem
            className={cn({
              "border rounded-lg p-4": showingNewInput && hasBanks,
            })}
          >
            <FormLabel>Bank Name*</FormLabel>
            {hasBanks && (
              <Combobox
                options={options}
                value={showingNewInput ? ADD_NEW_VALUE : value}
                onValueChange={(next) => {
                  if (next === ADD_NEW_VALUE) {
                    setIsAddingNew(true);
                    setNewBankName("");
                    field.onChange("");
                  } else {
                    setIsAddingNew(false);
                    setNewBankName("");
                    field.onChange(next);
                  }
                }}
                ariaLabel="Bank Name"
                placeholder="Select a bank"
                searchPlaceholder="Search banks..."
                emptyText="No banks found."
              />
            )}

            {showingNewInput && (
              <div className={cn({ "mt-2": hasBanks })}>
                {hasBanks && (
                  <FormLabel htmlFor="new-bank-name">New Bank</FormLabel>
                )}
                <Input
                  id="new-bank-name"
                  type="text"
                  placeholder="N26"
                  value={isAddingNew ? newBankName : value}
                  className={cn({ "mt-2": hasBanks })}
                  onChange={(e) => {
                    setIsAddingNew(true);
                    setNewBankName(e.target.value);
                    field.onChange(e.target.value);
                  }}
                />
                {alreadyExists && (
                  <FormDescription className="text-muted-foreground mt-2">
                    You already have an account with this bank. It will be filed
                    under the existing one.
                  </FormDescription>
                )}
              </div>
            )}
            <FormMessage aria-live="polite" />
          </FormItem>
        );
      }}
    />
  );
}
