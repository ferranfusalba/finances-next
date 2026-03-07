"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { cn } from "@/lib/utils";

export default function TransactionFormPayeeField() {
  const form = useFormContext();
  const { userTransactionPayees } = useTransactionUser();

  const [isAddingNewPayee, setIsAddingNewPayee] = useState(false);
  const [newPayee, setNewPayee] = useState("");

  return (
    <FormField
      control={form.control}
      name="payee"
      render={() => {
        return (
          <FormItem
            className={cn({
              "border rounded-lg p-4": isAddingNewPayee,
            })}
          >
            <FormLabel>Payee</FormLabel>
            <Controller
              control={form.control}
              name="payee"
              render={({ field: controllerField }) => (
                <>
                  <Select
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setIsAddingNewPayee(true);
                        setNewPayee("");
                        form.setValue("payee", "", {
                          shouldValidate: false,
                        });
                        form.clearErrors("payee");
                      } else {
                        setIsAddingNewPayee(false);
                        setNewPayee("");
                        controllerField.onChange(value);
                      }
                    }}
                    value={
                      isAddingNewPayee
                        ? "__new__"
                        : controllerField.value || ""
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__new__">
                        Add a new payee
                      </SelectItem>
                      <Separator className="my-2 px-2" />
                      {(() => {
                        const payees = userTransactionPayees
                          ?.filter((payee) => payee.name)
                          .sort((a, b) =>
                            (a.name as string).localeCompare(
                              b.name as string,
                            ),
                          );
                        if (!payees?.length) {
                          return (
                            <p className="text-sm text-muted-foreground text-center py-2 select-none">
                              No payees yet
                            </p>
                          );
                        }
                        return payees.map((payee) => (
                          <SelectItem
                            key={payee.id}
                            value={payee.name as string}
                          >
                            {payee.name}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>

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
                    </div>
                  )}
                </>
              )}
            />
            <FormMessage aria-live="polite" />
          </FormItem>
        );
      }}
    />
  );
}
