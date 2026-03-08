"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { AddAlt } from "@carbon/icons-react";

import { cn } from "@/lib/utils";

interface Props {
  accountTypes: string[];
}

const ADD_NEW_VALUE = "__new__";

export default function AccountTypeField({ accountTypes }: Props) {
  const form = useFormContext();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newType, setNewType] = useState("");

  const options: ComboboxOption[] = [
    { value: ADD_NEW_VALUE, label: "Add a new type", icon: <AddAlt className="mr-2 h-4 w-4" /> },
    ...accountTypes
      .sort((a, b) => a.localeCompare(b))
      .map((type) => ({ value: type, label: type })),
  ];

  return (
    <Controller
      control={form.control}
      name="type"
      render={({ field: controllerField }) => (
        <FormItem
          className={cn({
            "border rounded-lg p-4": isAddingNew,
          })}
        >
          <FormLabel>Account Type*</FormLabel>
          <Combobox
            options={options}
            value={isAddingNew ? ADD_NEW_VALUE : controllerField.value || ""}
            onValueChange={(value) => {
              if (value === ADD_NEW_VALUE) {
                setIsAddingNew(true);
                setNewType("");
                controllerField.onChange("");
              } else {
                setIsAddingNew(false);
                setNewType("");
                controllerField.onChange(value);
              }
            }}
            placeholder="Select an account type"
            searchPlaceholder="Search account types..."
            emptyText="No account types found."
          />

          {isAddingNew && (
            <div className="mt-2">
              <FormLabel htmlFor="new-account-type">New Type</FormLabel>
              <Input
                id="new-account-type"
                type="text"
                placeholder="Checking"
                value={newType}
                className="mt-2"
                onChange={(e) => {
                  const value = e.target.value;
                  setNewType(value);
                  controllerField.onChange(value);
                }}
              />
            </div>
          )}
          <FormMessage aria-live="polite" />
        </FormItem>
      )}
    />
  );
}
