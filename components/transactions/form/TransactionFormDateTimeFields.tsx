"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import { Calendar as CalendarIcon } from "@carbon/icons-react";

import { cn } from "@/lib/utils";

import { Timezone } from "@/types/Timezone";

import timezones from "@/statics/timezones-iana.json";

import { useCurrentUser } from "@/hooks/use-current-user";

export default function TransactionFormDateTimeFields() {
  const form = useFormContext();
  const user = useCurrentUser();

  const timezoneOptions: ComboboxOption[] = useMemo(
    () =>
      timezones.map((tz: Timezone) => ({
        value: tz.id,
        label: `(${tz.offset}) ${tz.name} — ${tz.region}`,
        searchLabel: `${tz.id} ${tz.name} ${tz.region} ${tz.offset}`,
      })),
    []
  );

  return (
    <>
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
                      !field.value && "text-muted-foreground",
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
                  defaultMonth={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date > new Date()}
                  weekStartsOn={(user?.weekStartsOn ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
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
        name="timezoneId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone*</FormLabel>
            <Combobox
              options={timezoneOptions}
              value={field.value || ""}
              onValueChange={field.onChange}
              ariaLabel="Timezone"
              placeholder="Select a timezone"
              searchPlaceholder="Search timezones..."
              emptyText="No timezones found."
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
