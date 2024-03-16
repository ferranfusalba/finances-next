"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { Account } from "@/types/Account";
import "./AccountTransactionAdd.css";
import { Currency } from "@/types/Currency";
import { currenciesList } from "@/utils/getCurrenciesList";

interface Props {
  account: Account | null;
}

export default function AccountTransactionAdd(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const foreignCurrenciesList = currenciesList.filter(
    (currency) => currency.code !== props.account?.defaultCurrency
  );

  const currentDate = new Date().getDate().toString().padStart(2, "0");
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const currentYear = new Date().getFullYear().toString();
  const currentHour = new Date().getHours().toString().padStart(2, "0");
  const currentMinute = new Date().getMinutes().toString().padStart(2, "0");
  const currentSecond = new Date().getSeconds().toString().padStart(2, "0");

  // Minutes & Seconds
  const minSec = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minSecString = minSec.map((unit) => String(unit));

  // Hours
  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const hoursString = hours.map((hour) => String(hour));

  // Days
  function getDaysInMonth(month: number, year: number) {
    // Number of days in each month (January is at index 0)
    const daysInMonth = [
      31,
      28 + Number(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)),
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    // Return the number of days for the given month and year
    return daysInMonth[month - 1]; // Subtract 1 because month is 1-indexed
  }

  // Months
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const monthsString = months.map((month) => String(month));

  const years = [
    "2000",
    "2001",
    "2002",
    "2003",
    "2004",
    "2005",
    "2006",
    "2007",
    "2008",
    "2009",
    "2010",
    "2011",
    "2012",
    "2013",
    "2014",
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
  ];

  const formSchema = z.object({
    payee: z.string().min(1, {
      message: "A Payee is required.",
    }),
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
    foreignCurrency: z.string(),
    foreignCurrencyAmount: z.string(),
    foreignCurrencyExchangeRate: z.string(),
    category: z.string(),
    subcategory: z.string(),
    tags: z.string(),
    dateDay: z.string().min(1, {
      message: "Required",
    }),
    dateMonth: z.string().min(1, {
      message: "Required",
    }),
    dateYear: z.string().min(4, {
      message: "Required",
    }),
    timeHour: z.string().min(1, {
      message: "Required",
    }),
    timeMinute: z.string().min(1, {
      message: "Required",
    }),
    timeSecond: z.string().min(1, {
      message: "Required",
    }),
    timezone: z.string(),
    location: z.string(),
    notes: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payee: "",
      concept: "",
      type: "",
      currency: props.account?.defaultCurrency as string,
      amountForm: "",
      foreignCurrency: "",
      foreignCurrencyAmount: "",
      foreignCurrencyExchangeRate: "",
      category: "",
      subcategory: "",
      tags: "",
      dateDay: currentDate,
      dateMonth: currentMonth,
      dateYear: currentYear,
      timeHour: currentHour,
      timeMinute: currentMinute,
      timeSecond: currentSecond,
      timezone: "",
      location: "",
      notes: "",
    },
  });

  const dateYear = form.getValues().dateYear;
  const dateMonth = form.getValues().dateMonth;
  const dateDay = form.getValues().dateDay;

  const buildDateDay = new Date(
    Number(dateYear),
    Number(dateMonth) - 1,
    Number(dateDay),
    Number(currentHour),
    Number(currentMinute),
    Number(currentSecond),
    0
  );

  const daysNumber = getDaysInMonth(Number(dateMonth), Number(dateYear));

  const days = Array.from({ length: daysNumber }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  const daysString = days.map((day) => String(day));
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const balanceOnAccount = props.account!.currentBalance;

    const dateBuilt = new Date(
      Number(values.dateYear),
      Number(values.dateMonth) - 1,
      Number(values.dateDay),
      Number(values.timeHour),
      Number(values.timeMinute),
      Number(values.timeSecond),
      0 // TODO: Integrate here timezone
    );

    const payee = values.payee;
    const concept = values.concept;
    const type = values.type;
    const currency = values.currency;
    const amountForm = parseFloat(values.amountForm);
    const foreignCurrency = values.foreignCurrency;
    const foreignCurrencyAmount = parseFloat(values.foreignCurrencyAmount);
    const foreignCurrencyExchangeRate = parseFloat(
      values.foreignCurrencyExchangeRate
    );
    const category = values.category;
    const subcategory = values.subcategory;
    const tags = values.tags;
    const dateTime = dateBuilt;
    const timezone = values.timezone;
    const location = values.location;
    const notes = values.notes;
    const accountId = props.account?.id;
    const balance = balanceOnAccount + amountForm;

    startTransition(async () => {
      await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        body: JSON.stringify({
          currentBalance: balance,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      await fetch("/api/accounts/transactions/", {
        method: "POST",
        body: JSON.stringify({
          payee,
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
          accountId,
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
            Add a transaction to this account:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-flow-row md:grid-flow-col gap-4 md:gap-8">
              <div className="space-y-4">
                {/* Payee */}
                <FormField
                  control={form.control}
                  name="payee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payee*</FormLabel>
                      <FormControl>
                        <Input
                          id="payee"
                          type="text"
                          placeholder="ZRH Duty Free"
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
                {/* Date & Time */}
                <div className="flex justify-between">
                  <div>
                    <FormField
                      control={form.control}
                      name="dateDay"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Day*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="dateDay"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="00"
                        //       max="31"
                        //       placeholder="08"
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Day*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {daysString.map((day) => {
                                return (
                                  <SelectItem
                                    value={day}
                                    key={day}
                                    disabled={buildDateDay > new Date()}
                                  >
                                    {day}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="dateMonth"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Month*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="dateMonth"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="00"
                        //       max="12"
                        //       placeholder="02"
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Month*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {monthsString.map((month) => {
                                const dateYear = form.getValues().dateYear;

                                const buildDate = new Date(
                                  Number(dateYear),
                                  Number(month) - 1,
                                  Number(currentDate),
                                  Number(currentHour),
                                  Number(currentMinute),
                                  Number(currentSecond),
                                  0
                                );

                                return (
                                  <SelectItem
                                    value={month}
                                    key={month}
                                    disabled={buildDate > new Date()}
                                  >
                                    {month}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="dateYear"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Year*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="dateYear"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="1970"
                        //       max={currentYear}
                        //       placeholder={currentYear.toString()}
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Year*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem value={year} key={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <FormField
                      control={form.control}
                      name="timeHour"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Hour*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="timeHour"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="00"
                        //       max="23"
                        //       placeholder="02"
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Hour*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {hoursString.map((hour) => (
                                <SelectItem value={hour} key={hour}>
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="timeMinute"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Min.*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="timeMinute"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="00"
                        //       max="59"
                        //       placeholder="50"
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Min.*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {minSecString.map((min) => (
                                <SelectItem value={min} key={min}>
                                  {min}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="timeSecond"
                      render={({ field }) => (
                        // <FormItem>
                        //   <FormLabel>Sec.*</FormLabel>
                        //   <FormControl>
                        //     <Input
                        //       id="timeSecond"
                        //       type="number"
                        //       inputMode="numeric"
                        //       pattern="[0-9]*"
                        //       min="00"
                        //       max="59"
                        //       placeholder="59"
                        //       {...field}
                        //     />
                        //   </FormControl>
                        //   <FormMessage />
                        // </FormItem>
                        <FormItem>
                          <FormLabel>Sec.*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {minSecString.map((sec) => (
                                <SelectItem value={sec} key={sec}>
                                  {sec}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input
                          id="timezone"
                          type="text"
                          placeholder="UTC+01:00"
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
                {/* Foreign Currency */}
                <FormField
                  control={form.control}
                  name="foreignCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foreign Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* TODO: Add here the common currencies list */}
                          {/* <SelectGroup>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="CHF">CHF</SelectItem>
                          </SelectGroup> */}
                          <SelectGroup>
                            {/* <SelectLabel>
                              <hr />
                            </SelectLabel> */}
                            {foreignCurrenciesList.map((currency: Currency) => (
                              <SelectItem
                                value={currency.code}
                                key={currency.code}
                              >
                                {currency.code} - {currency.name} (
                                {currency.symbol_native})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Foreign Currency Amount */}
                <FormField
                  control={form.control}
                  name="foreignCurrencyAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foreign Currency Amount</FormLabel>
                      <FormControl>
                        <Input
                          id="foreignCurrencyAmount"
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
                {/* Foreign Currency Exchange Rate */}
                <FormField
                  control={form.control}
                  name="foreignCurrencyExchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foreign Currency Exchange Rate</FormLabel>
                      <FormControl>
                        <Input
                          id="foreignCurrencyExchangeRate"
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
                          placeholder="Zürich Airport, Kloten, CH"
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
