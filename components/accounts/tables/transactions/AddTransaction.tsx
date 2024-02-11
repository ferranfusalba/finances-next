"use client";
import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
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

interface Props {
  accountId: number;
}

export const AddTransaction = (props: Props) => {
  const [open, setOpen] = useState(false);

  const formSchema = z.object({
    amountForm: z.string().min(1, {
      message: "Amount Type is required.",
    }),
    concept: z.string().min(1, {
      message: "Concept Type is required.",
    }),
    type: z.string().min(1, {
      message: "Transaction Type is required.",
    }),
    currency: z.string().min(3, {
      message: "Currency code must be at least 3 characters.",
    }),
    notes: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountForm: "",
      concept: "",
      type: "",
      currency: "EUR",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const amountForm = parseFloat(values.amountForm);
    const concept = values.concept;
    const type = values.type;
    const currency = values.currency;
    const notes = values.notes;
    const accountId = props.accountId;
    const balance = 0;

    await fetch("/api/accounts/transactions/", {
      method: "POST",
      body: JSON.stringify({
        amount: amountForm,
        concept,
        type,
        currency,
        notes,
        accountId,
        balance,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(() => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a transaction to this account:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amountForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      id="amountForm"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="399,99"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Concept */}
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept</FormLabel>
                  <FormControl>
                    <Input
                      id="concept"
                      type="text"
                      placeholder="Groceries"
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
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input
                      id="type"
                      type="text"
                      placeholder="EXPENSES"
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
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input
                      id="currency"
                      type="text"
                      placeholder="EUR"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      id="notes"
                      type="text"
                      placeholder="Mercadona"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional field</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
