"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Form } from "@/components/ui/form";

import TransactionFormContent from "@/components/transactions/form/TransactionFormContent";

import { computeTransactionAmount, nextTimeIncrement } from "@/lib/utils/transaction";
import { detectTimezone, timezoneToSelectValue } from "@/lib/utils/timezone";

import { useTransactionUser } from "@/contexts/TransactionUserContext";

import {
  buildBudgetTransactionSchema,
  type BudgetTransactionFormValues,
} from "@/schemas/transactionForm";

import { Budget } from "@/types/Budget";

interface Props {
  budget: Budget | null;
}

const formSchema = buildBudgetTransactionSchema();

export default function BudgetTransactionAdd(props: Props) {
  const { userTimezone } = useTransactionUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeCounterRef = useRef(540);

  const detectedTimezone = detectTimezone(userTimezone || undefined);
  const detectedTimezoneValue = detectedTimezone
    ? timezoneToSelectValue(detectedTimezone)
    : undefined;

  const form = useForm<BudgetTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: "",
      type: "",
      currency: props.budget?.defaultCurrency as string,
      amountForm: "",
      foreignCurrency: "",
      foreignCurrencyAmount: "",
      foreignCurrencyExchangeRate: "",
      category: "",
      subcategory: "",
      tags: [],
      date: new Date(),
      time: "09:00",
      timezone: detectedTimezoneValue,
      location: null,
      notes: "",
    },
  });

  const onSubmit = async (values: BudgetTransactionFormValues) => {
    const timezoneToOffset = parseInt(values.timezone.split("|")[0]);
    const timezoneToOffsetString = values.timezone.split("|")[0];

    const selectedDate = values.date;
    const dateBuilt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      Number(values.time.split(":")[0] ?? 9),
      Number(values.time.split(":")[1] ?? 0),
      0,
      timezoneToOffset,
    );

    const concept = values.concept;
    const type = values.type;
    const currency = values.currency;
    const amountRaw = parseFloat(values.amountForm);
    const amountForm = computeTransactionAmount(type, amountRaw);
    const foreignCurrency = values.foreignCurrency;
    const foreignCurrencyAmount = parseFloat(values.foreignCurrencyAmount);
    const foreignCurrencyExchangeRate = parseFloat(
      values.foreignCurrencyExchangeRate,
    );
    const category = values.category;
    const subcategory = values.subcategory;
    const tags = values.tags;
    const dateTime = dateBuilt;
    const timezone = timezoneToOffsetString;
    const location = values.location;
    const notes = values.notes;
    const budgetId = props.budget?.id;

    startTransition(async () => {
      const res = await fetch("/api/budgets/transactions/", {
        method: "POST",
        body: JSON.stringify({
          concept,
          type,
          currency,
          amount: amountForm,
          foreignCurrency,
          foreignCurrencyAmount,
          foreignCurrencyExchangeRate,
          category,
          subcategory,
          tags,
          dateTime,
          timezone,
          location,
          notes,
          budgetId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setOpen(false);
        toast.success(`Transaction for ${concept} has been added`, {
          description: `${amountForm + " " + currency}`,
        });
        router.refresh();
      } else {
        const json = await res.json();
        toast.error("Failed to add transaction", {
          description: json.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          const { time, nextCounter } = nextTimeIncrement(
            timeCounterRef.current,
          );
          form.setValue("time", time);
          timeCounterRef.current = nextCounter;
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-md:max-h-margins-y-mobile max-md:h-screen max-md:overflow-y-scroll sm:max-w-200 overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a transaction to this budget:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TransactionFormContent
              variant="budget"
              defaultCurrency={props.budget?.defaultCurrency}
            />
            <DialogFooter>
              <Button variant="secondary" type="submit" disabled={isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
