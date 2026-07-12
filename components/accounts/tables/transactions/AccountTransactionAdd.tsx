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

import { currency } from "@/lib/utils";
import { accountLabel } from "@/lib/utils/account";
import {
  computeTransactionAmount,
  convertFormTaxLines,
  getNextTimeForDate,
  type TransactionType,
} from "@/lib/utils/transaction";
import { detectTimezone, getTimezoneOffset } from "@/lib/utils/timezone";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { transactionTypeToCategoryType } from "@/lib/utils/categoryType";

import {
  buildAccountTransactionSchema,
  type AccountTransactionFormValues,
} from "@/schemas/transactionForm";

import { Account } from "@/types/Account";
import { AccountTransaction } from "@/types/Transaction";


interface Props {
  account: Account | null;
  accountTransactions?: AccountTransaction[];
  editTransaction?: AccountTransaction;
  copyTransaction?: AccountTransaction;
  editOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
  /**
   * Pre-selects the type and locks the select. Used by the missing-opening banner
   * to open this same dialog as "set the opening balance" — OPENING is not in the
   * dropdown, so it can only be reached this way.
   */
  defaultType?: TransactionType;
  /**
   * Money that landed in this cash leg and is now being put to work: opens the
   * dialog pre-filled as a transfer of the same amount into the invested parent.
   *
   * It creates a NEW transaction — the source row is untouched. Cash going in and
   * cash being invested are two movements, days apart, and the provider posts
   * them as two. This just saves you retyping the second one.
   */
  investFrom?: AccountTransaction;
  /** The invested parent to transfer into. Required alongside investFrom. */
  investDestinationAccountId?: string;
  /**
   * Uninvested cash left in the leg. The prefilled amount is capped at it — you
   * cannot invest money that is no longer sitting there, and after investing a
   * contribution the row it came from is still on screen with its button.
   */
  investAvailableCash?: number;
  /** Pre-fills the concept on a new transaction. */
  prefillConcept?: string;
  /** Pre-fills the date on a new transaction. */
  prefillDate?: Date;
  /** Pre-fills the time, "HH:MM". */
  prefillTime?: string;
  /**
   * Posting the month's market movement, from a row on the invested leg. Opened
   * by a row action, so the dialog is controlled and has no trigger of its own.
   */
  addReturn?: boolean;
  /** Overrides the dialog's trigger button. */
  trigger?: React.ReactNode;
}

const formSchema = buildAccountTransactionSchema();

export default function AccountTransactionAdd(props: Props) {
  const {
    userAccounts,
    userLocale,
    userTimezone,
  } = useTransactionUser();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!props.editTransaction;
  const isCopying = !!props.copyTransaction;
  const isInvesting = !!props.investFrom;
  const isAddingReturn = !!props.addReturn;
  const editTx = props.editTransaction ?? props.copyTransaction ?? null;

  // Every mode but "add" is driven from outside — a row action opened it, so the
  // dialog has no trigger button of its own and its open state is the caller's.
  const isControlled =
    isEditing || isCopying || isInvesting || isAddingReturn;

  const isOpening =
    (editTx?.type ?? props.defaultType) === "OPENING";

  // When editing a transfer from the destination account, lock type and destination fields
  const isTransferDestination =
    isEditing &&
    editTx?.type === "TRANSFER" &&
    !!editTx.typeTransferOrigin &&
    editTx.typeTransferOrigin !== props.account?.id;

  const detectedTimezone = detectTimezone(userTimezone || undefined);
  const detectedTimezoneValue = detectedTimezone?.id;

  const editDate = editTx?.dateTime ? new Date(editTx.dateTime) : undefined;
  const editTime = editTx?.dateTime
    ? (() => {
        const d = new Date(editTx.dateTime);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      })()
    : undefined;
  const editTimezoneValue = editTx?.timezoneId || undefined;

  const invest = props.investFrom;
  // The date defaults to the day the money arrived, but is editable: a provider
  // holds your cash for a few days before buying, so the two rarely share a date.
  const investDate = invest ? new Date(invest.dateTime) : undefined;
  const investDestination = userAccounts.find(
    (a) => a.id === props.investDestinationAccountId,
  );

  // Capped at what is actually still sitting in cash. Invest a €1.000 contribution
  // and its row stays on screen, button and all — without the cap, clicking again
  // would cheerfully move a second €1.000 that is not there.
  const investAmount = invest
    ? props.investAvailableCash != null
      ? Math.min(Math.abs(invest.amount), props.investAvailableCash)
      : Math.abs(invest.amount)
    : undefined;

  const form = useForm<AccountTransactionFormValues>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      payee: editTx?.payee ?? "",
      recurring: editTx?.recurring ?? "",
      concept:
        editTx?.concept ??
        props.prefillConcept ??
        (props.defaultType === "OPENING" ? "Opening balance" : ""),
      type: editTx?.type ?? (invest ? "TRANSFER" : props.defaultType ?? ""),
      typeTransferDestinationAccount:
        editTx?.typeTransferDestination ??
        props.investDestinationAccountId ??
        "",
      currency: editTx?.currency ?? (props.account?.defaultCurrency as string),
      amountForm: editTx
        ? Math.abs(editTx.amount).toString()
        : investAmount != null
          ? investAmount.toString()
          : "",
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
      date: editDate ?? investDate ?? props.prefillDate ?? new Date(),
      time: editTime ?? props.prefillTime ?? "09:00",
      // Deliberately NOT inherited from the source row when investing. Investing
      // is a new transaction, so it takes your timezone like any other — and a
      // source row carrying a timezone the picker does not list would render this
      // required field blank.
      timezoneId: editTimezoneValue ?? detectedTimezoneValue,
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
    const selectedDate = values.date;
    const dateBuilt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      Number(values.time.split(":")[0] ?? 9),
      Number(values.time.split(":")[1] ?? 0),
    );

    const payee = values.payee;
    const recurring = values.recurring || null;
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
    const timezoneId = values.timezoneId;
    const timezoneOffset = getTimezoneOffset(timezoneId, dateBuilt);
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
          transactionTypeToCategoryType(type) &&
          fetch("/api/user/transaction-categories/", {
            method: "POST",
            body: JSON.stringify({
              name: category,
              subcategory,
              type: transactionTypeToCategoryType(type),
            }),
            headers: { "Content-Type": "application/json" },
          }),
      ]);

      const transactionPayload = {
        payee,
        recurring,
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
        timezoneId,
        timezoneOffset,
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
        if (isControlled) {
          props.onEditOpenChange?.(false);
        } else {
          setOpen(false);
        }
        toast.success(
          isEditing
            ? `Transaction for ${payee || concept} has been updated`
            : `Transaction for ${payee || concept} has been added`,
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
    // Investing keeps the source row's date as its starting point; auto-advancing
    // the time from the destination account's last row would throw that away.
    if (isControlled) return;
    if (isDateInitRef.current) {
      isDateInitRef.current = false;
      return;
    }
    if (watchedDate && props.accountTransactions) {
      const time = getNextTimeForDate(watchedDate, props.accountTransactions);
      form.setValue("time", time);
    }
  }, [watchedDate, isEditing, isCopying, props.accountTransactions, form]);

  const dialogOpen = isControlled ? (props.editOpen ?? false) : open;
  const handleDialogOpenChange = (isOpen: boolean) => {
    if (isControlled) {
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
      {!isControlled && (
        <DialogTrigger asChild>
          {props.trigger ?? (
            <Button variant="outline" className="gap-2"><AddAlt /> Add Transaction</Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-lg:max-h-margins-y-mobile max-lg:h-screen max-lg:overflow-y-scroll sm:max-w-250 overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAddingReturn
              ? `${props.prefillConcept} return`
              : isInvesting
                ? "Invest this cash"
                : isOpening
                  ? "Set Opening Balance"
                  : isEditing
                    ? "Edit Transaction"
                    : "New Transaction"}
            {isCopying && <Badge variant="secondary">Copying</Badge>}
          </DialogTitle>
          <DialogDescription>
            {isAddingReturn ? (
              <>
                What the market made — or lost — over {props.prefillConcept}, gross
                of fees. Enter a negative amount for a month that lost value; the
                sign is preserved. Fees and retenciones live on the cash leg, so
                they can never be mistaken for a bad month.
              </>
            ) : isInvesting ? (
              <>
                Move this cash into {investDestination?.name ?? "the invested leg"}.
                The cash row it came from stays as it is — money arriving and money
                being invested are two movements, and your provider posts them
                days apart. Adjust the date to when it was actually invested, and
                the amount if only part of it was.
                {props.investAvailableCash != null && (
                  <>
                    {" "}
                    There is{" "}
                    <strong>
                      {currency(
                        userLocale,
                        props.account?.defaultCurrency ?? "EUR",
                      ).format(props.investAvailableCash)}
                    </strong>{" "}
                    of uninvested cash left.
                  </>
                )}
              </>
            ) : isOpening ? (
              <>
                What{" "}
                {props.account
                  ? accountLabel(props.account, userAccounts)
                  : "this account"}{" "}
                held when your records begin. It must be dated before every
                existing transaction on the account.
              </>
            ) : (
              <>
                {isEditing ? "Edit" : "Add a new"} transaction
                {isEditing ? " in" : " to"} {props.account?.bankName}
                {" · "}
                {props.account?.name}:
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TransactionFormContent
              account={props.account}
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
