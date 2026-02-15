"use client";

import { useEffect } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { TrashCan as Trash2 } from "@carbon/icons-react";

import { computeTaxAmount, computeTotalTax } from "@/lib/utils/transaction";

export default function TransactionFormTaxFields() {
  const form = useFormContext();

  const {
    fields: taxFields,
    append: appendTax,
    remove: removeTax,
  } = useFieldArray({
    control: form.control,
    name: "taxLines",
  });

  const watchedTaxLines = useWatch({
    control: form.control,
    name: "taxLines",
  });
  const watchedAmount = useWatch({
    control: form.control,
    name: "amountForm",
  });
  const selectedType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (!watchedAmount || !watchedTaxLines?.length) return;
    watchedTaxLines.forEach((_: unknown, index: number) => {
      form.setValue(`taxLines.${index}.amount`, watchedAmount);
    });
  }, [watchedAmount]);

  if (
    !(selectedType === "EXPENSE" || selectedType === "EXPENSE_N") ||
    !(parseFloat(watchedAmount) > 0)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FormLabel>Sales Tax</FormLabel>
      </div>
      <div className="space-y-4 border rounded-lg p-4">
        {taxFields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tax lines added.
          </p>
        )}
        {taxFields.map((taxField, index) => {
          const rate = parseFloat(
            watchedTaxLines?.[index]?.rate || "0",
          );
          const amount = parseFloat(
            watchedTaxLines?.[index]?.amount || "0",
          );
          const inclusive =
            watchedTaxLines?.[index]?.inclusive ?? true;
          const taxAmount = computeTaxAmount(rate, amount, inclusive);

          return (
            <div
              key={taxField.id}
              className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`taxLines.${index}.rate`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Rate %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`taxLines.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          placeholder="50.00"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-8"
                  onClick={() => removeTax(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name={`taxLines.${index}.inclusive`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal text-sm">
                        Tax included in amount
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {rate > 0 && amount > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Tax: {taxAmount.toFixed(2)}
                  </span>
                ) : (
                  !watchedTaxLines?.[index]?.rate && (
                    <span className="text-sm text-destructive">
                      Rate required to register tax
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
        {taxFields.length > 0 &&
          (() => {
            const totalTax = computeTotalTax(watchedTaxLines);
            return totalTax > 0 ? (
              <div className="text-sm font-medium pt-2 border-t">
                Total Tax: {totalTax.toFixed(2)}
              </div>
            ) : null;
          })()}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendTax({
              rate: "21",
              amount: form.getValues("amountForm") || "",
              inclusive: true,
            })
          }
        >
          + Add tax line
        </Button>
      </div>
    </div>
  );
}
