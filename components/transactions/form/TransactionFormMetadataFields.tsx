"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useTransactionUser } from "@/contexts/TransactionUserContext";

export default function TransactionFormMetadataFields() {
  const form = useFormContext();
  const { userTransactionLocations, userTransactionTags } = useTransactionUser();

  return (
    <>
      {/* Tags */}
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="Duty Free, Gifts..."
              suggestions={userTransactionTags}
            />
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
                list="locationSuggestions"
                placeholder="Zürich Flughafen, Kloten, CH"
                {...field}
              />
            </FormControl>
            <datalist id="locationSuggestions">
              {userTransactionLocations.map((loc) => (
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
    </>
  );
}
