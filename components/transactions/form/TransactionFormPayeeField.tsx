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

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { cn } from "@/lib/utils";

const ADD_NEW_VALUE = "__new__";

export default function TransactionFormPayeeField() {
  const form = useFormContext();
  const { userTransactionPayees } = useTransactionUser();

  const [isAddingNewPayee, setIsAddingNewPayee] = useState(false);
  const [newPayee, setNewPayee] = useState("");

  const payeeAlreadyExists = useMemo(() => {
    if (!isAddingNewPayee || !newPayee.trim()) return false;
    return userTransactionPayees?.some(
      (payee) =>
        payee.name?.toLowerCase() === newPayee.trim().toLowerCase(),
    );
  }, [isAddingNewPayee, newPayee, userTransactionPayees]);

  const payees = userTransactionPayees
    ?.filter((payee) => payee.name)
    .sort((a, b) =>
      (a.name as string).localeCompare(b.name as string),
    );

  const options: ComboboxOption[] = [
    {
      value: ADD_NEW_VALUE,
      label: "Add a new payee",
      icon: <AddAlt className="mr-2 h-4 w-4" />,
    },
    ...(payees?.map((payee) => ({
      value: payee.name as string,
      label: payee.name as string,
    })) ?? []),
  ];

  return (
    <Controller
      control={form.control}
      name="payee"
      render={({ field: controllerField }) => (
        <FormItem
          className={cn({
            "border rounded-lg p-4": isAddingNewPayee,
          })}
        >
          <FormLabel>Payee</FormLabel>
          <Combobox
            options={options}
            value={isAddingNewPayee ? ADD_NEW_VALUE : controllerField.value || ""}
            onValueChange={(value) => {
              if (value === ADD_NEW_VALUE) {
                setIsAddingNewPayee(true);
                setNewPayee("");
                controllerField.onChange("");
              } else {
                setIsAddingNewPayee(false);
                setNewPayee("");
                controllerField.onChange(value);
              }
            }}
            placeholder="Select a payee"
            searchPlaceholder="Search payees..."
            emptyText="No payees found."
          />

          {isAddingNewPayee && (
            <div className="mt-2">
              <FormLabel htmlFor="new-payee">
                New Payee
              </FormLabel>
              <Input
                id="new-payee"
                type="text"
                placeholder="ZRH Duty Free"
                value={newPayee}
                className="mt-2"
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPayee(value);
                  controllerField.onChange(value);
                }}
              />
              {payeeAlreadyExists && (
                <FormDescription className="text-muted-foreground mt-2">
                  A payee with this name already exists. The existing one will be used.
                </FormDescription>
              )}
            </div>
          )}
          <FormMessage aria-live="polite" />
        </FormItem>
      )}
    />
  );
}
