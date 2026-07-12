"use client";

import { useFormContext, useWatch } from "react-hook-form";

import CurrencyTag from "@/components/chips/CurrencyTag";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { accountLabel } from "@/lib/utils/account";
import {
  isTransactionTypeAllowed,
  selectableTransactionTypes,
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from "@/lib/utils/transaction";

import { Account } from "@/types/Account";

interface Props {
  account?: Account | null;
  isTransferDestination?: boolean;
  transferOriginAccountId?: string;
}

export default function TransactionFormBasicFields({ account, isTransferDestination, transferOriginAccountId }: Props) {
  const form = useFormContext();
  const { userAccounts } = useTransactionUser();

  const selectedType = useWatch({ control: form.control, name: "type" });

  // Only accounts that can actually hold a TRANSFER may be a destination — the
  // server writes the mirror row there without it ever passing through a form.
  //
  // Excluded by id, not name: names are not unique. Two investment accounts at
  // the same provider each have a cash leg called "Cash", and matching on the
  // name would hide one from the other.
  const userAccounts4Transactions = userAccounts?.filter(
    (a) => a.id !== account?.id && isTransactionTypeAllowed(a.type, "TRANSFER"),
  );

  // OPENING is never offered. The form only ever shows it when it is already the
  // row's type — either the banner opened this form to set a missing opening, or
  // an existing opening is being edited. Either way it is the only option and the
  // select is locked: you cannot turn an opening into an expense, or vice versa.
  const isOpeningRow = selectedType === "OPENING";

  const typeOptions: TransactionType[] = isOpeningRow
    ? ["OPENING"]
    : account
      ? selectableTransactionTypes(account.type)
      : [];

  const typeLocked = isTransferDestination || isOpeningRow;

  // RETURN and ROUNDING may be negative — March 2026 on Indexa Fondos was
  // -1.099,94 — so they join OPENING in escaping the min=0 constraint.
  const allowsNegativeAmount =
    selectedType === "OPENING" ||
    selectedType === "RETURN" ||
    selectedType === "ROUNDING";

  const handleAmountPlaceholder = () => {
    switch (form.getValues().type) {
      case "":
        return "Select a type first";
      case "OPENING":
        return "Amount (positive or negative)";
      case "RETURN":
        return "Return (negative if the month lost value)";
      case "WITHHOLDING":
        return "Amount withheld (retenciones)";
      case "ROUNDING":
        return "Cent adjustment (positive or negative)";
      case "CONTRIBUTION":
        return "Amount paid in";
      case "WITHDRAWAL":
        return "Amount taken out";
      case "FEE":
        return "Fee charged by the provider";
      default:
        return "Amount";
    }
  };

  return (
    <>
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
              disabled={typeLocked}
            >
              <FormControl>
                <SelectTrigger aria-label="Type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem value={type} key={type}>
                    {TRANSACTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedType === "TRANSFER" && (
        isTransferDestination ? (
          <FormItem>
            <FormLabel>Transfer from Origin Account</FormLabel>
            <FormControl>
              <Input
                type="text"
                disabled
                value={(() => {
                  const origin = userAccounts.find((a) => a.id === transferOriginAccountId);
                  return origin ? accountLabel(origin, userAccounts, "-") : "";
                })()}
              />
            </FormControl>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name="typeTransferDestinationAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer to Destination Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Transfer to Destination Account">
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {userAccounts4Transactions.map(
                        (acct: Account) => (
                          <SelectItem
                            value={acct.id}
                            key={acct.id}
                          >
                            {accountLabel(acct, userAccounts, "-")}{" "}
                            {account?.defaultCurrency !==
                            acct.defaultCurrency ? (
                              <CurrencyTag code={acct.defaultCurrency as string} />
                            ) : (
                              ""
                            )}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      )}
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
            <FormControl>
              <Input
                id="amountForm"
                type="number"
                inputMode="decimal"
                step="0.01"
                disabled={selectedType === ""}
                min={allowsNegativeAmount ? undefined : 0}
                placeholder={handleAmountPlaceholder()}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
