"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
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
  accountTypes: string[];
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
    type: z.string().min(1, {
      message: "Account Type is required.",
    }),
    number: z.string(),
    country: z.string(),
    defaultCurrency: z.string().min(1, {
      message: "Currency is required.",
    }),
    description: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: "",
      name: "",
      code: "",
      type: "",
      number: "",
      country: "",
      defaultCurrency: userCurrency,
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const bankName = values.bankName;
    const name = values.name;
    const code = values.code;
    const active = true;
    const type = values.type;
    const description = values.description;
    const currentBalance = 0;
    const defaultCurrency = values.defaultCurrency;
    const number = values.number;
    const country = values.country;

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
          currentBalance,
          defaultCurrency,
          number,
          country,
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
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name*</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="N26" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <AccountTypeField accountTypes={props.accountTypes} />
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
