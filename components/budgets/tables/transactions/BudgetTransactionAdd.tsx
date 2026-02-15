"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeTransactionAmount,
  nextTimeIncrement,
} from "@/lib/utils/transaction";
import { detectTimezone, timezoneToSelectValue } from "@/lib/utils/timezone";

import { Budget } from "@/types/Budget";
import { Currency } from "@/types/Currency";
import { Timezone } from "@/types/Timezone";

import currencies from "@/statics/currencies.json";
import timezones from "@/statics/timezones.json";

interface Props {
  budget: Budget | null;
  userTimezone: string;
  userForeignCurrencies: string[];
  userTransactionLocations: string[];
}

export default function BudgetTransactionAdd(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeCounterRef = useRef(540); // 9 * 60 = 09:00 in total minutes
  const defaultCurrencyCodes = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD"];
  const commonCurrencyCodes =
    props.userForeignCurrencies.length > 0
      ? props.userForeignCurrencies
      : defaultCurrencyCodes;
  const budgetCurrency = props.budget?.defaultCurrency;
  const foreignCurrenciesList = currencies.filter(
    (currency) => currency.code !== budgetCurrency
  );
  const commonCurrencies = foreignCurrenciesList.filter((c) =>
    commonCurrencyCodes.includes(c.code)
  );
  const remainingCurrencies = foreignCurrenciesList.filter(
    (c) => !commonCurrencyCodes.includes(c.code)
  );

  const handleResetFC = () => {
    form.setValue("foreignCurrency", "", { shouldValidate: false });
    form.setValue("foreignCurrencyAmount", "", { shouldValidate: false });
    form.setValue("foreignCurrencyExchangeRate", "", { shouldValidate: false });
    form.clearErrors(["foreignCurrency", "foreignCurrencyAmount", "foreignCurrencyExchangeRate"]);
  };

  const detectedTimezone = detectTimezone(props.userTimezone || undefined);
  const detectedTimezoneValue = detectedTimezone
    ? timezoneToSelectValue(detectedTimezone)
    : undefined;

  const formSchema = z
    .object({
      concept: z.string(),
      type: z.string().min(1, {
        message: "Transaction Type is required.",
      }),
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
    );

  const form = useForm<z.infer<typeof formSchema>>({
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
      tags: "",
      date: new Date(),
      time: "09:00",
      timezone: detectedTimezoneValue,
      location: "",
      notes: "",
    },
  });


  const selectedForeignCurrency = useWatch({ control: form.control, name: "foreignCurrency" });

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
    const budgetId = props.budget?.id;

    startTransition(async () => {
      // Server handles balance recomputation
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
        const { time, nextCounter } = nextTimeIncrement(timeCounterRef.current);
        form.setValue("time", time);
        timeCounterRef.current = nextCounter;
      }
    }}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="max-[800px]:max-h-margins-y-mobile sm:max-w-[800px] overflow-y-auto h-5/6 md:h-max modal-content">
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
                          <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                          <SelectItem value="TRANSFER" disabled>
                            TRANSFER
                          </SelectItem>
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
                      <FormControl>
                        <Input
                          id="amountForm"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          placeholder="Amount"
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
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                new Intl.DateTimeFormat("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }).format(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
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
                            autoFocus
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
                          placeholder="YouTube Premium"
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
                          placeholder="Digital Subscriptions, YouTube Premium"
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
                          {selectedForeignCurrency && (
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
                  {selectedForeignCurrency && (
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
                          placeholder="Zürich Airport, Kloten, CH"
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
