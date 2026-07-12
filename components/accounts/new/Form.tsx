"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";

import AccountTypeField from "@/components/accounts/form/AccountTypeField";
import BankNameField from "@/components/accounts/form/BankNameField";
import DateField from "@/components/forms/DateField";

import { atMidday } from "@/lib/utils/date";
import { SELECTABLE_ACCOUNT_TYPES } from "@/lib/utils/account";
import { countries } from "@/lib/utils/country";
import { currencies, getCurrencySymbol } from "@/lib/utils/currency";

const countryOptions = countries.map((country) => ({
  value: country.alpha2Code,
  label: `${country.alpha2Code} ${country.flag}  ${country.name}${country.fullName ? " (" + country.fullName + ")" : ""}`,
  searchLabel: `${country.alpha2Code} ${country.name} ${country.fullName ?? ""}`,
}));

const currencyOptions = currencies.map((currency) => ({
  value: currency.code,
  label: `${currency.code} - ${currency.name} (${getCurrencySymbol(currency.code)})`,
  searchLabel: `${currency.code} ${currency.name}`,
}));

interface Props {
  defaultCurrency: string;
  /** Banks the user already has accounts with. */
  bankNames: string[];
}

export default function NewAccountForm(props: Props) {
  const userCurrency = props.defaultCurrency;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formSchema = z.object({
    bankName: z.string().min(1, {
      message: "Bank Name is required.",
    }),
    name: z.string().min(1, {
      message: "Account Name is required.",
    }),
    code: z.string().min(1, {
      message: "Account Code is required.",
    }),
    // The enum, not z.string(): the client was looser than the API, so a typo'd
    // type only failed server-side. It also decides which transaction types the
    // account may hold, and it is immutable once set.
    // The investment cash leg is absent by design: it is added from its parent
    // investment account, not opened from scratch.
    type: z.enum(SELECTABLE_ACCOUNT_TYPES, {
      errorMap: () => ({ message: "Account Type is required." }),
    }),
    number: z.string(),
    country: z.string(),
    defaultCurrency: z.string().min(1, {
      message: "Currency is required.",
    }),
    description: z.string(),
    // The starting balance is the account's OPENING transaction, not a column.
    // It is compulsory here because it cannot be recovered later: an account
    // created without one silently starts from zero.
    openingBalance: z
      .string()
      .min(1, { message: "Starting balance is required." })
      .refine((v) => !Number.isNaN(parseFloat(v)), {
        message: "Starting balance must be a number.",
      }),
    // Settable, not stamped `now()`: you will create an account today and then
    // enter transactions from last month, and every transaction must fall after
    // the opening.
    openingDate: z.date({ message: "Starting date is required." }),
    // Optional, and only meaningful on an INVESTMENT account. Leaving it blank
    // creates no cash leg at all — you can still add one later.
    cashOpeningBalance: z
      .string()
      .refine((v) => v === "" || !Number.isNaN(parseFloat(v)), {
        message: "Cash starting balance must be a number.",
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: "",
      name: "",
      code: "",
      type: undefined,
      number: "",
      country: "",
      defaultCurrency: userCurrency,
      description: "",
      openingBalance: "",
      openingDate: new Date(),
      cashOpeningBalance: "",
    },
  });

  // An investment provider holds two balances — the invested position and the
  // cash it has not invested yet — so it is asked for both at once. Anything
  // else is asked for one.
  const selectedType = useWatch({ control: form.control, name: "type" });
  const isInvestment = selectedType === "INVESTMENT";

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const bankName = values.bankName;
    const name = values.name;
    const code = values.code;
    const active = true;
    const type = values.type;
    const description = values.description;
    const defaultCurrency = values.defaultCurrency;
    const number = values.number;
    const country = values.country;

    // Blank means no cash leg at all, which is different from a cash leg holding
    // zero — one you can still add later, the other already exists.
    const wantsCashLeg =
      type === "INVESTMENT" && values.cashOpeningBalance.trim() !== "";

    startTransition(async () => {
      const res = await fetch("/api/accounts/", {
        method: "POST",
        body: JSON.stringify({
          bankName,
          name,
          code,
          active,
          type,
          description,
          defaultCurrency,
          number,
          country,
          openingBalance: parseFloat(values.openingBalance),
          // Midday, so a timezone shift either way cannot move it onto the
          // previous or next day and trip the opening-before-everything rule.
          openingDate: atMidday(values.openingDate).toISOString(),
          cashOpeningBalance: wantsCashLeg
            ? parseFloat(values.cashOpeningBalance)
            : null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Account created successfully");
        router.push("/accounts/" + data.id);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error("Failed to create account", {
          description: data.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <div className="h-full flex justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 m-auto w-11/12 md:w-5/12 min-w-80 md:min-w-96"
          aria-busy={isPending}
        >
          {/* Bank Name */}
          <BankNameField bankNames={props.bankNames} />
          {/* Account Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name*</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Primary Space"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Code*</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="N26.PS"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Type */}
          <AccountTypeField />
          {/* Currency */}
          <FormField
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency*</FormLabel>
                <Combobox
                  options={currencyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a currency"
                  searchPlaceholder="Search currencies..."
                  emptyText="No currency found."
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Opening balance — written as the account's OPENING transaction */}
          <FormField
            control={form.control}
            name="openingBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isInvestment ? "Invested Starting Balance*" : "Starting Balance*"}
                </FormLabel>
                <FormControl>
                  <Input
                    id="openingBalance"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {isInvestment
                    ? "What was already invested when your records begin — not counting any uninvested cash your provider is holding. May be negative."
                    : "What the account held when your records begin. May be negative. Recorded as the account's opening transaction."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* The cash leg's opening, asked for at the same moment as the invested
              one. A provider that holds cash for you has two balances from the
              moment it exists; asking for them separately means entering the total
              as the invested figure and then going back to subtract it. */}
          {isInvestment && (
            <FormField
              control={form.control}
              name="cashOpeningBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash Starting Balance</FormLabel>
                  <FormControl>
                    <Input
                      id="cashOpeningBalance"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="Leave blank for no cash account"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Uninvested cash your provider is holding. Fill this in and a
                    cash account is created alongside, shown as a second table on
                    this account&apos;s page. Leave it blank if you would rather
                    not track it — you can add one later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <DateField
            name="openingDate"
            label="Starting Date*"
            id="openingDate"
            description="Every transaction on this account must fall after this date."
          />
          {/* Number */}
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="ES12 3456 7890"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Combobox
                  options={countryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a country"
                  searchPlaceholder="Search countries..."
                  emptyText="No country found."
                />
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional field</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </form>
      </Form>
    </div>
  );
}
