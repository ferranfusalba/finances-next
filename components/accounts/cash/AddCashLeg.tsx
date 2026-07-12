"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import { Account } from "@/types/Account";

const formSchema = z.object({
  name: z.string().min(1, { message: "Account Name is required." }),
  code: z.string().min(1, { message: "Account Code is required." }),
  openingBalance: z
    .string()
    .min(1, { message: "Starting balance is required." })
    .refine((v) => !Number.isNaN(parseFloat(v)), {
      message: "Starting balance must be a number.",
    }),
  openingDate: z.string().min(1, { message: "Starting date is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  account: Account;
}

/**
 * Adds the cash leg to an investment account.
 *
 * It lives here rather than on the new-account form because an investment cash
 * account is not a kind of account you go and open — it is a leg of a specific
 * investment account, and listing it as a peer of "Checking" invited you to
 * create one with no parent. Adding it from the parent means the parent is never
 * in question.
 *
 * Bank, currency and country are inherited: the cash your provider holds is at
 * the same provider, in the same currency, by definition.
 */
export default function AddCashLeg({ account }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Cash",
      code: `${account.code}.CASH`,
      openingBalance: "",
      openingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await fetch("/api/accounts/", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          code: values.code,
          type: "INVESTMENT_CASH",
          parentAccountId: account.id,
          bankName: account.bankName,
          defaultCurrency: account.defaultCurrency,
          country: account.country,
          number: "",
          description: "",
          active: true,
          openingBalance: parseFloat(values.openingBalance),
          // Midday, so a timezone shift either way cannot move it onto the
          // previous or next day and trip the opening-before-everything rule.
          openingDate: new Date(`${values.openingDate}T12:00:00`).toISOString(),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("Cash account added");
        setOpen(false);
        // Stay on the parent — the cash leg renders as its second table.
        router.refresh();
      } else {
        const data = await res.json();
        toast.error("Failed to add cash account", {
          description: data.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 select-none">
          Add cash account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add cash account</DialogTitle>
          <DialogDescription>
            The cash {account.bankName} holds for you before it is invested, and
            takes its fees and retenciones from. It appears as a second table on
            this page, and its balance rolls up into the total above.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-busy={isPending}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name*</FormLabel>
                  <FormControl>
                    <Input id="cashName" type="text" {...field} />
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
                    <Input id="cashCode" type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Balance*</FormLabel>
                  <FormControl>
                    <Input
                      id="cashOpeningBalance"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The uninvested cash sitting at {account.bankName} when your
                    records begin. Often 0.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Date*</FormLabel>
                  <FormControl>
                    <Input id="cashOpeningDate" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDescription>
              Currency, bank and country are inherited from{" "}
              {account.name}.
            </FormDescription>
            <DialogFooter>
              <Button variant="secondary" type="submit" disabled={isPending}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
