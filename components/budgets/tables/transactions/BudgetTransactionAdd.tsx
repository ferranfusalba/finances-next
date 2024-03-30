"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import "@/components/budgets/tables/transactions/BudgetTransactionAdd.css";

import { Budget } from "@/types/Budget";

interface Props {
  budget: Budget | null;
}

export default function BudgetTransactionAdd(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formSchema = z.object({
    concept: z.string().min(1, {
      message: "Concept Type is required.",
    }),
    type: z.string().min(1, {
      message: "Transaction Type is required.",
    }),
    currency: z.string().min(3, {
      message: "Currency code is required.",
    }),
    amountForm: z.string().min(1, {
      message: "Amount Type is required.",
    }),
    category: z.string(),
    subcategory: z.string(),
    tags: z.string(),
    notes: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "",
      type: "",
      currency: props.budget?.defaultCurrency as string,
      amountForm: "",
      category: "",
      subcategory: "",
      tags: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const balanceOnBudget = props.budget!.currentBalance;

    const concept = values.concept;
    const type = values.type;
    const currency = values.currency;
    const amountForm = parseFloat(values.amountForm);
    const category = values.category;
    const subcategory = values.subcategory;
    const tags = values.tags;
    const notes = values.notes;
    const budgetId = props.budget?.id;
    const balance = balanceOnBudget + amountForm;

    startTransition(async () => {
      await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        body: JSON.stringify({
          currentBalance: balance,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      await fetch("/api/budgets/transactions/", {
        method: "POST",
        body: JSON.stringify({
          concept,
          type,
          currency,
          amount: amountForm,
          category,
          subcategory,
          tags,
          notes,
          budgetId,
          balance,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(() => {
        setOpen(false);
        toast(`Transaction for ${concept} has been added`, {
          description: `${amountForm + " " + currency}`,
        });
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] overflow-y-auto h-5/6 md:h-max modal-content">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a transaction to this budget:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-flow-row md:grid-flow-col gap-4 md:gap-8">
              <div className="space-y-4">
                {/* Concept */}
                <FormField
                  control={form.control}
                  name="concept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concept*</FormLabel>
                      <FormControl>
                        <Input
                          id="concept"
                          type="text"
                          placeholder="1x Basler Läckerli Huus, 1x Sprüngli Box"
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
                      <FormLabel>Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INCOME">INCOME</SelectItem>
                          <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                          <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormLabel>Currency* (default by Account)</FormLabel>
                      <FormControl>
                        <Input id="currency" type="text" disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amountForm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount*</FormLabel>
                      {/* TODO: Check negative amounts with minus sign on mobile */}
                      <FormControl>
                        <Input
                          id="amountForm"
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
              </div>
              <div className="space-y-4">
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          id="category"
                          type="text"
                          placeholder="Digital Subscriptions"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Subcategory */}
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Input
                          id="subcategory"
                          type="text"
                          placeholder="HBO Max"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          id="tags"
                          type="text"
                          placeholder="Digital Subscriptions, HBO Max"
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
                          placeholder="Invoice Ref.: #123456"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
