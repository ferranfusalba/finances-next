"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

interface Props {
  accountTypes: string[];
}

export default function AccountTypeField({ accountTypes }: Props) {
  const form = useFormContext();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newType, setNewType] = useState("");

  return (
    <Controller
      control={form.control}
      name="type"
      render={({ field: controllerField }) => (
        <FormItem
          className={cn({
            "border rounded-lg p-4": isAddingNew,
          })}
        >
          <FormLabel>Account Type*</FormLabel>
          <Select
            onValueChange={(value) => {
              if (value === "__new__") {
                setIsAddingNew(true);
                setNewType("");
                controllerField.onChange("");
              } else {
                setIsAddingNew(false);
                setNewType("");
                controllerField.onChange(value);
              }
            }}
            value={
              isAddingNew ? "__new__" : controllerField.value || ""
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an account type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="__new__">Add a new type</SelectItem>
              <Separator className="my-2 px-2" />
              {(() => {
                const sorted = accountTypes.sort((a, b) => a.localeCompare(b));
                if (!sorted.length) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-2 select-none">
                      No account types yet
                    </p>
                  );
                }
                return sorted.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ));
              })()}
            </SelectContent>
          </Select>

          {isAddingNew && (
            <div className="mt-2">
              <FormLabel htmlFor="new-account-type">New Type</FormLabel>
              <Input
                id="new-account-type"
                type="text"
                placeholder="Checking"
                value={newType}
                className="mt-2"
                onChange={(e) => {
                  const value = e.target.value;
                  setNewType(value);
                  controllerField.onChange(value);
                }}
              />
            </div>
          )}
          <FormMessage aria-live="polite" />
        </FormItem>
      )}
    />
  );
}
