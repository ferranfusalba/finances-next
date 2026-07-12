"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import DateField from "@/components/forms/DateField";

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
      <DateField name="date" label="Date*" id="date" />
      {/* Time */}
      <FormField
        control={form.control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time</FormLabel>
            <FormControl>
              <Input id="time" type="time" {...field} />
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
