"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { AddAlt } from "@carbon/icons-react";

import { Badge } from "@/components/ui/badge";
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

import {
  computeTransactionAmount,
  convertFormTaxLines,
  getNextTimeForDate,
} from "@/lib/utils/transaction";
import { detectTimezone, timezoneToSelectValue } from "@/lib/utils/timezone";

import { useTransactionUser } from "@/contexts/TransactionUserContext";

import {
  buildAccountTransactionSchema,
  type AccountTransactionFormValues,
} from "@/schemas/transactionForm";

import { Account } from "@/types/Account";
import { AccountTransaction } from "@/types/Transaction";

import timezones from "@/statics/timezones.json";

interface Props {
  account: Account | null;
  accountTransactions?: AccountTransaction[];
  editTransaction?: AccountTransaction;
  copyTransaction?: AccountTransaction;
  editOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
  hasOpeningTransaction?: boolean;
}

const formSchema = buildAccountTransactionSchema();

export default function AccountTransactionAdd(props: Props) {
  const {
    userAccounts,
    userTimezone,
  } = useTransactionUser();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!props.editTransaction;
  const isCopying = !!props.copyTransaction;
  const editTx = props.editTransaction ?? props.copyTransaction ?? null;

  // When editing a transfer from the destination account, lock type and destination fields
  const isTransferDestination =
    isEditing &&
    editTx?.type === "TRANSFER" &&
    !!editTx.typeTransferOrigin &&
    editTx.typeTransferOrigin !== props.account?.id;

  const detectedTimezone = detectTimezone(userTimezone || undefined);
  const detectedTimezoneValue = detectedTimezone
    ? timezoneToSelectValue(detectedTimezone)
    : undefined;

  const editDate = editTx?.dateTime ? new Date(editTx.dateTime) : undefined;
  const editTime = editTx?.dateTime
    ? (() => {
        const d = new Date(editTx.dateTime);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      })()
    : undefined;
  const editTimezoneValue = editTx?.timezone
    ? (() => {
        const tz = timezones.find(
          (t) => t.offset.toString() === editTx.timezone,
        );
        return tz ? timezoneToSelectValue(tz) : undefined;
      })()
    : undefined;

  const form = useForm<AccountTransactionFormValues>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      payee: editTx?.payee ?? "",
      concept: editTx?.concept ?? "",
      type: editTx?.type ?? "",
      typeTransferDestinationAccount: editTx?.typeTransferDestination ?? "",
      currency: editTx?.currency ?? (props.account?.defaultCurrency as string),
      amountForm: editTx ? Math.abs(editTx.amount).toString() : "",
      foreignCurrency: editTx?.foreignCurrency ?? "",
      foreignCurrencyAmount: editTx?.foreignCurrencyAmount
        ? editTx.foreignCurrencyAmount.toString()
        : "",
      foreignCurrencyExchangeRate: editTx?.foreignCurrencyExchangeRate
        ? editTx.foreignCurrencyExchangeRate.toString()
        : "",
      category: editTx?.category ?? "",
      subcategory: editTx?.subcategory ?? "",
      tags: editTx?.tags ?? [],
      date: editDate ?? new Date(),
      time: editTime ?? "09:00",
      timezone: editTimezoneValue ?? detectedTimezoneValue,
      location: editTx?.location ?? null,
      notes: editTx?.notes ?? "",
      taxLines:
        editTx?.taxLines?.map((tl) => ({
          rate: tl.rate.toString(),
          amount: tl.amount.toString(),
          inclusive: tl.inclusive,
        })) ?? [],
    },
  });

  // Cross-field effect: sync transfer destination currency to foreign currency
  const accountOriginCurrency = useWatch({
    control: form.control,
    name: "currency",
  });
  const selectedTransferAccountId = useWatch({
    control: form.control,
    name: "typeTransferDestinationAccount",
  });
  const selectedTransferAccountCurrency =
    userAccounts.find((a) => a.id === selectedTransferAccountId)
      ?.defaultCurrency ?? "";

  const isInitialTransferMount = useRef(true);

  useEffect(() => {
    if (isInitialTransferMount.current) {
      isInitialTransferMount.current = false;
      return;
    }
    if (
      selectedTransferAccountId &&
      selectedTransferAccountCurrency !== accountOriginCurrency
    ) {
      form.setValue("foreignCurrency", selectedTransferAccountCurrency);
    } else {
      form.setValue("foreignCurrency", "");
      form.setValue("foreignCurrencyAmount", "");
      form.setValue("foreignCurrencyExchangeRate", "");
    }
  }, [
    selectedTransferAccountId,
    selectedTransferAccountCurrency,
    accountOriginCurrency,
    form,
  ]);

  const onSubmit = async (values: AccountTransactionFormValues) => {
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

    const payee = values.payee;
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
    const taxLines = convertFormTaxLines(values.taxLines);
    const accountId = props.account?.id;

    startTransition(async () => {
      await Promise.all([
        payee &&
          fetch("/api/user/transaction-payees/", {
            method: "POST",
            body: JSON.stringify({ name: payee }),
            headers: { "Content-Type": "application/json" },
          }),
        category &&
          fetch("/api/user/transaction-categories/", {
            method: "POST",
            body: JSON.stringify({ name: category, subcategory }),
            headers: { "Content-Type": "application/json" },
          }),
      ]);

      const transactionPayload = {
        payee,
        concept,
        type,
        typeTransferOrigin: isTransferDestination
          ? editTx!.typeTransferOrigin
          : accountId,
        typeTransferDestination: isTransferDestination
          ? editTx!.typeTransferDestination
          : selectedTransferAccountId,
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
        taxLines,
        accountId,
      };

      const res = isEditing
        ? await fetch(`/api/accounts/transactions/${editTx!.id}`, {
            method: "PUT",
            body: JSON.stringify(transactionPayload),
            headers: { "Content-Type": "application/json" },
          })
        : await fetch("/api/accounts/transactions/", {
            method: "POST",
            body: JSON.stringify(transactionPayload),
            headers: { "Content-Type": "application/json" },
          });

      if (res.ok) {
        if (isEditing || isCopying) {
          props.onEditOpenChange?.(false);
        } else {
          setOpen(false);
        }
        toast.success(
          isEditing
            ? `Transaction for ${concept} has been updated`
            : `Transaction for ${concept} has been added`,
          { description: `${amountForm + " " + currency}` },
        );
        router.refresh();
      } else {
        const json = await res.json();
        toast.error(
          isEditing
            ? "Failed to update transaction"
            : "Failed to add transaction",
          {
            description: json.error ?? "Unknown error",
          },
        );
      }
    });
  };

  // When the date changes on a new transaction, compute the time based on existing transactions
  const watchedDate = useWatch({ control: form.control, name: "date" });

  const isDateInitRef = useRef(true);

  useEffect(() => {
    if (isEditing || isCopying) return;
    if (isDateInitRef.current) {
      isDateInitRef.current = false;
      return;
    }
    if (watchedDate && props.accountTransactions) {
      const time = getNextTimeForDate(watchedDate, props.accountTransactions);
      form.setValue("time", time);
    }
  }, [watchedDate, isEditing, isCopying, props.accountTransactions, form]);

  const dialogOpen = isEditing || isCopying ? (props.editOpen ?? false) : open;
  const handleDialogOpenChange = (isOpen: boolean) => {
    if (isEditing || isCopying) {
      props.onEditOpenChange?.(isOpen);
    } else {
      setOpen(isOpen);
      if (isOpen) {
        form.reset();
        isDateInitRef.current = true;
        const date = form.getValues("date") ?? new Date();
        const time = getNextTimeForDate(
          date,
          props.accountTransactions ?? []
        );
        form.setValue("time", time);
      }
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      {!isEditing && !isCopying && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2"><AddAlt /> Add Transaction</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-lg:max-h-margins-y-mobile max-lg:h-screen max-lg:overflow-y-scroll sm:max-w-250 overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Edit Transaction" : "New Transaction"}
            {isCopying && <Badge variant="secondary">Copying</Badge>}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Edit" : "Add a new"} transaction
            {isEditing ? " in" : " to"} {props.account?.bankName}
            {" · "}
            {props.account?.name}:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TransactionFormContent
              variant="account"
              account={props.account}
              hasOpeningTransaction={props.hasOpeningTransaction}
              isTransferDestination={isTransferDestination}
              transferOriginAccountId={isTransferDestination ? editTx?.typeTransferOrigin ?? undefined : undefined}
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
