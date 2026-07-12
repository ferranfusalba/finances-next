"use client";

import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
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

import { Calendar as CalendarIcon } from "@carbon/icons-react";

import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Props {
  name: string;
  label: string;
  description?: string;
  /** Future dates are meaningless for a transaction that already happened. */
  disableFuture?: boolean;
  id?: string;
}

/**
 * The one date picker.
 *
 * The account form used a native `<input type="date">` while the transaction form
 * used this popover calendar, so the same task looked like two different apps —
 * and the native control renders differently in every browser. Both now use this.
 *
 * Binds a `Date` in the form state, so callers get a Date rather than a string
 * they have to parse.
 */
export default function DateField({
  name,
  label,
  description,
  disableFuture = true,
  id,
}: Props) {
  const form = useFormContext();
  const user = useCurrentUser();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  id={id}
                  type="button"
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
                disabled={
                  disableFuture ? (date) => date > new Date() : undefined
                }
                weekStartsOn={
                  (user?.weekStartsOn ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6
                }
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
