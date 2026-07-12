"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Edit } from "@carbon/icons-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import BankNameField from "@/components/accounts/form/BankNameField";

import { ACCOUNT_TYPE_LABELS } from "@/lib/utils/account";
import { countries } from "@/lib/utils/country";
import { currencies, getCurrencySymbol } from "@/lib/utils/currency";

import { Account } from "@/types/Account";

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

// `type` is absent: an account's type is immutable once created, because it
// decides which transaction types the account may hold. It is shown read-only
// below and the API strips it from the update payload regardless.
const formSchema = z.object({
  bankName: z.string().min(1, { message: "Bank Name is required." }),
  name: z.string().min(1, { message: "Account Name is required." }),
  code: z.string().min(1, { message: "Account Code is required." }),
  number: z.string(),
  country: z.string(),
  defaultCurrency: z.string().min(1, { message: "Currency is required." }),
  description: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  account: Account;
  /** Banks the user already has accounts with. */
  bankNames: string[];
}

export default function EditAccount({ account, bankNames }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: account.bankName,
      name: account.name,
      code: account.code,
      number: account.number ?? "",
      country: account.country,
      defaultCurrency: account.defaultCurrency,
      description: account.description ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("Account updated successfully");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error("Failed to update account", {
          description: data.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Edit account">
          <Edit />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-busy={isPending}
          >
            <BankNameField bankNames={bankNames} />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name*</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Code*</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  disabled
                  aria-label="Account Type"
                  value={ACCOUNT_TYPE_LABELS[account.type]}
                  readOnly
                />
              </FormControl>
              <p className="text-muted-foreground mt-1 text-xs select-none">
                An account&apos;s type is fixed once created. To change it, open
                a new account.
              </p>
            </FormItem>
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Optional field</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
