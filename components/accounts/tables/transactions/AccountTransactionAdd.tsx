"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useForm, useWatch, useFieldArray, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import "@/components/accounts/tables/transactions/AccountTransactionAdd.css";
import BackgroundChip from "@/components/chips/BackgroundChip";
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
  SelectGroup,
  SelectLabel,
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
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { CalendarIcon, Trash2, X } from "lucide-react";

import { getCurrencyColor0, getCurrencyColor1 } from "@/lib/utils/currency";
import {
  computeTransactionAmount,
  computeTaxAmount,
  computeTotalTax,
  convertFormTaxLines,
  nextTimeIncrement,
} from "@/lib/utils/transaction";
import { detectTimezone, timezoneToSelectValue } from "@/lib/utils/timezone";

import { Account } from "@/types/Account";
import { Currency } from "@/types/Currency";
import { Timezone } from "@/types/Timezone";

import currencies from "@/statics/currencies.json";
import timezones from "@/statics/timezones.json";
import { cn } from "@/lib/utils";

interface Props {
  account: Account | null;
  userAccounts: Array<Account>;
  userTransactionPayees: Array<{
    id: string | null;
    userId: string | null;
    name: string | null;
  }>;
  userTransactionCategories: Array<{
    id: string | null;
    userId: string | null;
    name: string | null;
    subcategories: Array<{
      categoryId: string | null;
      id: string | null;
      name: string | null;
      userId: string | null;
    }>;
  }>;
  userId: string;
  userTimezone: string;
  userForeignCurrencies: string[];
  userTransactionLocations: string[];
  hasTransactions: boolean;
}

export default function AccountTransactionAdd(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [newPayee, setNewPayee] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [isAddingNewPayee, setIsAddingNewPayee] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isAddingNewSubcategory, setIsAddingNewSubcategory] = useState(false);

  const [isPending, startTransition] = useTransition();
  const timeCounterRef = useRef(540); // 9 * 60 = 09:00 in total minutes
  const defaultCurrencyCodes = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD"];
  const commonCurrencyCodes =
    props.userForeignCurrencies.length > 0
      ? props.userForeignCurrencies
      : defaultCurrencyCodes;
  const accountCurrency = props.account?.defaultCurrency;
  const foreignCurrenciesList = currencies.filter(
    (currency) => currency.code !== accountCurrency
  );
  const commonCurrencies = foreignCurrenciesList.filter((c) =>
    commonCurrencyCodes.includes(c.code)
  );
  const remainingCurrencies = foreignCurrenciesList.filter(
    (c) => !commonCurrencyCodes.includes(c.code)
  );

  const detectedTimezone = detectTimezone(props.userTimezone || undefined);
  const detectedTimezoneValue = detectedTimezone
    ? timezoneToSelectValue(detectedTimezone)
    : undefined;

  const userAccounts4Transactions = props.userAccounts?.filter(
    (account) => account.name !== props.account?.name
  );

  const handleAmountPlaceholder = () => {
    switch (form.getValues().type) {
      case "":
        return "Select a type first";
      case "OPENING":
        return "Amount (positive or negative)";
      default:
        return "Amount";
    }
  };

  const formSchema = z
    .object({
      payee: z.string().min(1, {
        message: "Payee is required.",
      }),
      concept: z.string(),
      type: z.string().min(1, {
        message: "Transaction Type is required.",
      }),
      typeTransferDestinationAccount: z.string(),
      currency: z.string().min(3, {
        message: "Currency code is required.",
      }),
      amountForm: z.string().min(1, {
        message: "Amount Type is required.",
      }),
      foreignCurrency: z.string(),
      foreignCurrencyAmount: z.string(),
      foreignCurrencyExchangeRate: z.string(),
      category: z.string(),
      subcategory: z.string(),
      tags: z.string(),
      date: z.date({ required_error: "A date is required." }),
      time: z.string(),
      timezone: z.string().min(1, {
        message: "Timezone is required",
      }),
      location: z.string(),
      notes: z.string(),
      taxLines: z.array(z.object({
        rate: z.string(),
        amount: z.string(),
        inclusive: z.boolean(),
      })),
    })
    .refine(
      (data) => {
        if (data.foreignCurrency && !data.foreignCurrencyAmount) {
          return false;
        }
        return true;
      },
      {
        message:
          "Foreign Currency Amount is required when Foreign Currency is provided.",
        path: ["foreignCurrencyAmount"],
      }
    )
    .refine(
      (data) => {
        if (data.type === "TRANSFER" && !data.typeTransferDestinationAccount) {
          return false;
        }
        return true;
      },
      {
        message:
          "Transfer to Destination Account is required when Transaction Type is TRANSFER.",
        path: ["typeTransferDestinationAccount"],
      }
    );

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      payee: "", // Not at Budget Transaction Form
      concept: "",
      type: "",
      typeTransferDestinationAccount: "",
      currency: props.account?.defaultCurrency as string,
      amountForm: "",
      foreignCurrency: "",
      foreignCurrencyAmount: "",
      foreignCurrencyExchangeRate: "",
      category: "",
      subcategory: "",
      tags: "",
      date: new Date(),
      time: "09:00",
      timezone: detectedTimezoneValue,
      location: "",
      notes: "",
      taxLines: [],
    },
  });

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control: form.control,
    name: "taxLines",
  });

  const watchedTaxLines = useWatch({ control: form.control, name: "taxLines" });

  const watchedForeignCurrency = useWatch({ control: form.control, name: "foreignCurrency" });

  const handleResetFC = () => {
    form.setValue("foreignCurrency", "", { shouldValidate: false });
    form.setValue("foreignCurrencyAmount", "", { shouldValidate: false });
    form.setValue("foreignCurrencyExchangeRate", "", { shouldValidate: false });
    form.clearErrors(["foreignCurrency", "foreignCurrencyAmount", "foreignCurrencyExchangeRate"]);
  };

  const selectedType = useWatch({ control: form.control, name: "type" });
  const watchedAmount = useWatch({ control: form.control, name: "amountForm" });

  useEffect(() => {
    if (!watchedAmount || !watchedTaxLines?.length) return;
    watchedTaxLines.forEach((_, index) => {
      form.setValue(`taxLines.${index}.amount`, watchedAmount);
    });
  }, [watchedAmount]);

  const accountOriginCurrency = useWatch({ control: form.control, name: "currency" });

  const selectedTransferAccountId = useWatch({ control: form.control, name: "typeTransferDestinationAccount" });
  const selectedTransferAccountCurrency = props.userAccounts.find(
    (a) => a.id === selectedTransferAccountId
  )?.defaultCurrency ?? "";

  useEffect(() => {
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

  const category = useWatch({ control: form.control, name: "category" });

  useEffect(() => {
    form.setValue("subcategory", ""); // Reset subcategory when category changes
  }, [category, form]); // Watch for changes in category

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const timezoneToOffset = parseInt(values.timezone.split("|")[0]);
    const timezoneToOffsetString = values.timezone.split("|")[0];

    const selectedDate = values.date;
    const dateBuilt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      Number(values.time.split(":")[0]) || 9,
      Number(values.time.split(":")[1]) || 0,
      0,
      timezoneToOffset
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
      values.foreignCurrencyExchangeRate
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
      const payeeToSubmit =
        values.payee === "__new__" ? newPayee : values.payee;
      const categoryToSubmit =
        values.category === "__new__" ? newCategory : values.category;

      await fetch("/api/user/transaction-payees/", {
        method: "POST",
        body: JSON.stringify({
          name: payeeToSubmit,
          userId: props.userId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      await fetch("/api/user/transaction-categories/", {
        method: "POST",
        body: JSON.stringify({
          name: categoryToSubmit,
          userId: props.userId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      // Server handles balance recomputation and transfer mirror transaction
      const res = await fetch("/api/accounts/transactions/", {
        method: "POST",
        body: JSON.stringify({
          payee,
          concept,
          type,
          typeTransferOrigin: accountId,
          typeTransferDestination: selectedTransferAccountId,
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
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setOpen(false);
        toast(`Transaction for ${concept} has been added`, {
          description: `${amountForm + " " + currency}`,
        });
        router.refresh();
      } else {
        const json = await res.json();
        toast("Failed to add transaction", {
          description: json.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        const { nextCounter, time } = nextTimeIncrement(timeCounterRef.current);
        form.setValue("time", time);
        timeCounterRef.current = nextCounter;
      }
    }}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-[1000px]:max-h-margins-y-mobile sm:max-w-[1000px] overflow-y-auto h-5/6 md:h-max modal-content">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to {props.account?.bankName}
            {" · "}
            {props.account?.name}:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4">
                {/* Payee */}
                <FormField
                  control={form.control}
                  name="payee"
                  render={() => {
                    return (
                      <FormItem
                        className={cn({
                          "border rounded-lg p-4": isAddingNewPayee,
                        })}
                      >
                        <FormLabel>Payee*</FormLabel>
                        <Controller
                          control={form.control}
                          name="payee"
                          render={({ field: controllerField }) => (
                            <>
                              <Select
                                onValueChange={(value) => {
                                  if (value === "__new__") {
                                    setIsAddingNewPayee(true);
                                    setNewPayee("");
                                    form.setValue("payee", "", { shouldValidate: false });
                                    form.clearErrors("payee");
                                  } else {
                                    setIsAddingNewPayee(false);
                                    setNewPayee("");
                                    controllerField.onChange(value);
                                  }
                                }}
                                value={
                                  isAddingNewPayee
                                    ? "__new__"
                                    : controllerField.value || ""
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a payee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__new__">
                                    Add a new payee
                                  </SelectItem>
                                  <Separator className="my-2 px-2" />
                                  {props.userTransactionPayees
                                    ?.map((payee) => (
                                      <SelectItem
                                        key={payee.id}
                                        value={payee.name as string}
                                      >
                                        {payee.name}
                                      </SelectItem>
                                    ))
                                    .sort(function (a, b) {
                                      if (a.props.value > b.props.value) {
                                        return 1;
                                      }

                                      if (a.props.value < b.props.value) {
                                        return -1;
                                      }

                                      return 0;
                                    })}
                                </SelectContent>
                              </Select>

                              {isAddingNewPayee && (
                                <div className="mt-2">
                                  <FormLabel htmlFor="new-payee">
                                    New Payee
                                  </FormLabel>
                                  <Input
                                    id="new-payee"
                                    type="text"
                                    placeholder="ZRH Duty Free"
                                    value={newPayee}
                                    className="mt-2"
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setNewPayee(value);
                                      controllerField.onChange(value);
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        />
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    );
                  }}
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
                          <SelectItem value="INCOME_N">
                            INCOME (Not counted as such)
                          </SelectItem>
                          <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                          <SelectItem value="EXPENSE_N">
                            EXPENSE (Not counted as such)
                          </SelectItem>
                          <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                          {!props.hasTransactions && (
                            <SelectItem value="OPENING">OPENING</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedType === "TRANSFER" && (
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {userAccounts4Transactions.map(
                                (account: Account) => (
                                  <SelectItem
                                    value={account.id}
                                    key={account.id}
                                  >
                                    {account.bankName} - {account.name}{" "}
                                    {props.account?.defaultCurrency !==
                                    account.defaultCurrency ? (
                                      <BackgroundChip
                                        data={account.defaultCurrency as string}
                                        backgroundColor={
                                          getCurrencyColor0(
                                            account.defaultCurrency as string
                                          ) as string
                                        }
                                        textColor={
                                          getCurrencyColor1(
                                            account.defaultCurrency as string
                                          ) as string
                                        }
                                      />
                                    ) : (
                                      ""
                                    )}
                                  </SelectItem>
                                )
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          min={selectedType === "OPENING" ? undefined : 0}
                          placeholder={handleAmountPlaceholder()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Date Picker */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }).format(field.value)
                                : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Time */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {timezones.map((timezone: Timezone) => (
                              <SelectItem
                                value={
                                  timezone.offset.toString() +
                                  "|" +
                                  timezone.text
                                }
                                key={timezone.id}
                              >
                                {timezone.text} - {timezone.value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
                  render={() => {
                    return (
                      <FormItem
                        className={cn({
                          "border rounded-lg p-4": isAddingNewCategory,
                        })}
                      >
                        <FormLabel>Category*</FormLabel>
                        <Controller
                          control={form.control}
                          name="category"
                          render={({ field: controllerField }) => (
                            <>
                              <Select
                                onValueChange={(value) => {
                                  if (value === "__new__") {
                                    setIsAddingNewCategory(true);
                                    setNewCategory("");
                                    controllerField.onChange("");
                                  } else {
                                    setIsAddingNewCategory(false);
                                    setNewCategory("");
                                    controllerField.onChange(value);
                                  }
                                }}
                                value={
                                  isAddingNewCategory
                                    ? "__new__"
                                    : controllerField.value || ""
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__new__">
                                    Add a new category
                                  </SelectItem>
                                  <Separator className="my-2 px-2" />
                                  {props.userTransactionCategories
                                    ?.map((category) => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.name as string}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))
                                    .sort(function (a, b) {
                                      if (a.props.value > b.props.value) {
                                        return 1;
                                      }

                                      if (a.props.value < b.props.value) {
                                        return -1;
                                      }

                                      return 0;
                                    })}
                                </SelectContent>
                              </Select>

                              {isAddingNewCategory && (
                                <div className="mt-2">
                                  <FormLabel htmlFor="new-category">
                                    New Category
                                  </FormLabel>
                                  <Input
                                    id="new-category"
                                    type="text"
                                    placeholder="Groceries"
                                    value={newCategory}
                                    className="mt-2"
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setNewCategory(value);
                                      controllerField.onChange(value);
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        />
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    );
                  }}
                />
                {/* Subcategory */}
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={() => {
                    return (
                      <FormItem
                        className={cn({
                          "border rounded-lg p-4": isAddingNewSubcategory,
                        })}
                      >
                        <FormLabel>Subcategory</FormLabel>
                        <Controller
                          control={form.control}
                          name="subcategory"
                          render={({ field: controllerField }) => {
                            return (
                              <>
                                <Select
                                  onValueChange={(value) => {
                                    if (value === "__new__") {
                                      setIsAddingNewSubcategory(true);
                                      setNewSubcategory("");
                                      controllerField.onChange("");
                                    } else {
                                      setIsAddingNewSubcategory(false);
                                      setNewSubcategory("");
                                      controllerField.onChange(value);
                                    }
                                  }}
                                  value={
                                    isAddingNewSubcategory
                                      ? "__new__"
                                      : controllerField.value || ""
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a subcategory" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="__new__">
                                      Add a new subcategory
                                    </SelectItem>
                                    <Separator className="my-2 px-2" />
                                    {props.userTransactionCategories
                                      ?.find(
                                        (category) =>
                                          // Matches by name (not ID) because categories are stored as plain strings in the DB.
                                          // Switching to ID-based lookup requires a DB migration and data migration.
                                          category.name ===
                                          form.getValues().category
                                      )
                                      ?.subcategories?.sort((a, b) =>
                                        (a.name as string).localeCompare(
                                          b.name as string
                                        )
                                      )
                                      ?.map((sub) => (
                                        <SelectItem
                                          key={sub.id}
                                          value={sub.name as string}
                                        >
                                          {sub.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>

                                {isAddingNewSubcategory && (
                                  <div className="mt-2">
                                    <FormLabel htmlFor="new-subcategory">
                                      New Subcategory
                                    </FormLabel>
                                    <Input
                                      id="new-subcategory"
                                      type="text"
                                      placeholder="Cookies, Swiss Chocolate"
                                      value={newSubcategory}
                                      className="mt-2"
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setNewSubcategory(value);
                                        controllerField.onChange(value);
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            );
                          }}
                        />
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    );
                  }}
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
                          placeholder="Duty Free, Gifts"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Foreign Currency Fields */}
                <div className="space-y-4 border rounded-lg p-4">
                  <FormField
                    control={form.control}
                    name="foreignCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foreign Currency</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a foreign currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  {props.userForeignCurrencies.length > 0
                                    ? "Previously used"
                                    : "Common"}
                                </SelectLabel>
                                {commonCurrencies.map((currency: Currency) => (
                                  <SelectItem
                                    value={currency.code}
                                    key={currency.code}
                                  >
                                    {currency.code} - {currency.name} (
                                    {currency.symbol_native})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>All currencies</SelectLabel>
                                {remainingCurrencies.map(
                                  (currency: Currency) => (
                                    <SelectItem
                                      value={currency.code}
                                      key={currency.code}
                                    >
                                      {currency.code} - {currency.name} (
                                      {currency.symbol_native})
                                    </SelectItem>
                                  )
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {watchedForeignCurrency && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={handleResetFC}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchedForeignCurrency && (
                    <>
                      <FormField
                        control={form.control}
                        name="foreignCurrencyAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount*</FormLabel>
                            <FormControl>
                              <Input
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
                      <FormField
                        control={form.control}
                        name="foreignCurrencyExchangeRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exchange Rate</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="1.595"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          id="location"
                          type="text"
                          list="locationSuggestions"
                          placeholder="Zürich Flughafen, Kloten, CH"
                          {...field}
                        />
                      </FormControl>
                      <datalist id="locationSuggestions">
                        {props.userTransactionLocations.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
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
                {/* Sales Tax Lines */}
                {(selectedType === "EXPENSE" || selectedType === "EXPENSE_N") && parseFloat(watchedAmount) > 0 && <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>Sales Tax</FormLabel>
                  </div>
                  <div className="space-y-4 border rounded-lg p-4">
                    {taxFields.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tax lines added.</p>
                    )}
                    {taxFields.map((taxField, index) => {
                      const rate = parseFloat(watchedTaxLines?.[index]?.rate || "0");
                      const amount = parseFloat(watchedTaxLines?.[index]?.amount || "0");
                      const inclusive = watchedTaxLines?.[index]?.inclusive ?? true;
                      const taxAmount = computeTaxAmount(rate, amount, inclusive);

                      return (
                        <div key={taxField.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`taxLines.${index}.rate`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Rate %</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.01"
                                      min={0}
                                      max={100}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`taxLines.${index}.amount`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.01"
                                      min={0}
                                      placeholder="50.00"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => removeTax(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <FormField
                              control={form.control}
                              name={`taxLines.${index}.inclusive`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="mt-0! font-normal text-sm">
                                    Tax included in amount
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            {rate > 0 && amount > 0 ? (
                              <span className="text-sm text-muted-foreground">
                                Tax: {taxAmount.toFixed(2)}
                              </span>
                            ) : !watchedTaxLines?.[index]?.rate && (
                              <span className="text-sm text-destructive">
                                Rate required to register tax
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {taxFields.length > 0 && (() => {
                      const totalTax = computeTotalTax(watchedTaxLines);
                      return totalTax > 0 ? (
                        <div className="text-sm font-medium pt-2 border-t">
                          Total Tax: {totalTax.toFixed(2)}
                        </div>
                      ) : null;
                    })()}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendTax({
                        rate: "21",
                        amount: form.getValues("amountForm") || "",
                        inclusive: true,
                      })}
                    >
                      + Add tax line
                    </Button>
                  </div>
                </div>}
              </div>
            </div>
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
