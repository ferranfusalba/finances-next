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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import AccountTypeField from "@/components/accounts/form/AccountTypeField";

import countries from "@/statics/countries.json";
import currencies from "@/statics/currencies.json";

import { Account } from "@/types/Account";
import { Currency } from "@/types/Currency";
import { Country } from "@/types/Country";

const formSchema = z.object({
  bankName: z.string().min(1, { message: "Bank Name is required." }),
  name: z.string().min(1, { message: "Account Name is required." }),
  code: z.string().min(1, { message: "Account Code is required." }),
  type: z.string().min(1, { message: "Account Type is required." }),
  number: z.string(),
  country: z.string(),
  defaultCurrency: z.string().min(1, { message: "Currency is required." }),
  description: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  account: Account;
  accountTypes: string[];
}

export default function EditAccount({ account, accountTypes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: account.bankName,
      name: account.name,
      code: account.code,
      type: account.type,
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
        toast("Account updated successfully");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast("Failed to update account", {
          description: data.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label="Edit account">
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
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name*</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <AccountTypeField accountTypes={accountTypes} />
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country: Country) => (
                        <SelectItem
                          value={country["alpha-2"]}
                          key={country["alpha-2"]}
                        >
                          {country["alpha-2"]} {country["emoji-flag"]} {"  "}
                          {country.name}
                          {"  "}
                          {country["full-name"] &&
                            "(" + country["full-name"] + ")"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency: Currency) => (
                        <SelectItem value={currency.code} key={currency.code}>
                          {currency.code} - {currency.name} (
                          {currency.symbol_native})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
