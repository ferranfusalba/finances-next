"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import { currencies, getCurrencySymbol } from "@/lib/utils/currency";

import { User } from "@/types/User";

interface Props {
  user: User;
}

export default function NewBudgetForm(props: Props) {
  const userCurrency = props.user.userCurrency || "";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formSchema = z.object({
    name: z.string().min(1, {
      message: "Budget Name is required.",
    }),
    code: z.string().min(1, {
      message: "Budget Code is required.",
    }),
    type: z.string().min(1, {
      message: "Budget Type is required.",
    }),
    defaultCurrency: z.string().min(1, {
      message: "Currency is required.",
    }),
    description: z.string(),
    initialBalance: z.string().min(1, {
      message: "Initial Balance is required.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "",
      defaultCurrency: userCurrency,
      description: "",
      initialBalance: "",
    },
  });

  const currencyOptions: ComboboxOption[] = useMemo(
    () =>
      currencies.map((currency) => ({
        value: currency.code,
        label: `${currency.code} - ${currency.name} (${getCurrencySymbol(currency.code)})`,
        searchLabel: `${currency.code} ${currency.name}`,
      })),
    [],
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const name = values.name;
    const code = values.code;
    const active = true;
    const type = values.type;
    const description = values.description;
    const initialBalance = parseFloat(values.initialBalance);
    const defaultCurrency = values.defaultCurrency;

    startTransition(async () => {
      const res = await fetch("/api/budgets/", {
        method: "POST",
        body: JSON.stringify({
          name,
          code,
          active,
          type,
          description,
          initialBalance,
          defaultCurrency,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Budget created successfully");
        router.push("/budgets/" + data.id);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error("Failed to create budget", {
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
          {/* Budget Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Budget Name"
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
                <FormLabel>Budget Code</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Budget Code"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Type</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Budget Type"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Currency */}
          <FormField
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Combobox
                  options={currencyOptions}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Select a currency"
                  searchPlaceholder="Search currencies..."
                  emptyText="No currencies found."
                />
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
          {/* Initial Balance */}
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Balance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Initial Balance"
                    {...field}
                  />
                </FormControl>
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
