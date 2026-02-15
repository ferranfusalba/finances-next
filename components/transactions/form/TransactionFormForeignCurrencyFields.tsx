"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Close as X } from "@carbon/icons-react";

import { useTransactionUser } from "@/contexts/TransactionUserContext";

import { Currency } from "@/types/Currency";

import currencies from "@/statics/currencies.json";

interface Props {
  accountCurrency: string | undefined;
}

export default function TransactionFormForeignCurrencyFields({
  accountCurrency,
}: Props) {
  const form = useFormContext();
  const { userForeignCurrencies } = useTransactionUser();

  const defaultCurrencyCodes = [
    "USD",
    "EUR",
    "GBP",
    "CHF",
    "JPY",
    "CAD",
    "AUD",
  ];
  const commonCurrencyCodes =
    userForeignCurrencies.length > 0
      ? userForeignCurrencies
      : defaultCurrencyCodes;
  const foreignCurrenciesList = currencies.filter(
    (currency) => currency.code !== accountCurrency,
  );
  const commonCurrencies = foreignCurrenciesList.filter((c) =>
    commonCurrencyCodes.includes(c.code),
  );
  const remainingCurrencies = foreignCurrenciesList.filter(
    (c) => !commonCurrencyCodes.includes(c.code),
  );

  const watchedForeignCurrency = useWatch({
    control: form.control,
    name: "foreignCurrency",
  });

  const handleResetFC = () => {
    form.setValue("foreignCurrency", "", { shouldValidate: false });
    form.setValue("foreignCurrencyAmount", "", { shouldValidate: false });
    form.setValue("foreignCurrencyExchangeRate", "", {
      shouldValidate: false,
    });
    form.clearErrors([
      "foreignCurrency",
      "foreignCurrencyAmount",
      "foreignCurrencyExchangeRate",
    ]);
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <FormField
        control={form.control}
        name="foreignCurrency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Foreign Currency</FormLabel>
            <div className="flex gap-2">
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a foreign currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>
                      {userForeignCurrencies.length > 0
                        ? "Previously used"
                        : "Common"}
                    </SelectLabel>
                    {commonCurrencies.map((currency: Currency) => (
                      <SelectItem
                        value={currency.code}
                        key={currency.code}
                      >
                        {currency.code} - {currency.name} (
                        {currency.symbol_native})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>All currencies</SelectLabel>
                    {remainingCurrencies.map(
                      (currency: Currency) => (
                        <SelectItem
                          value={currency.code}
                          key={currency.code}
                        >
                          {currency.code} - {currency.name} (
                          {currency.symbol_native})
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {watchedForeignCurrency && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleResetFC}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {watchedForeignCurrency && (
        <>
          <FormField
            control={form.control}
            name="foreignCurrencyAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="34,50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="foreignCurrencyExchangeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange Rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="1.595"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
