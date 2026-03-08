"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

import { AddAlt } from "@carbon/icons-react";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { cn } from "@/lib/utils";

interface Props {
  variant: "account" | "budget";
}

const ADD_NEW_VALUE = "__new__";

export default function TransactionFormCategoryFields({ variant }: Props) {
  const form = useFormContext();
  const { userTransactionCategories } = useTransactionUser();

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isAddingNewSubcategory, setIsAddingNewSubcategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState("");

  const category = useWatch({ control: form.control, name: "category" });
  const prevCategory = useRef(category);

  useEffect(() => {
    if (prevCategory.current === category) return;
    prevCategory.current = category;
    if (variant === "account") {
      form.setValue("subcategory", "");
    }
  }, [category, form, variant]);

  if (variant === "budget") {
    return (
      <>
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
      </>
    );
  }

  const categories = userTransactionCategories
    ?.filter((cat) => cat.name)
    .sort((a, b) =>
      (a.name as string).localeCompare(b.name as string),
    );

  const categoryOptions: ComboboxOption[] = [
    {
      value: ADD_NEW_VALUE,
      label: "Add a new category",
      icon: <AddAlt className="mr-2 h-4 w-4" />,
    },
    ...(categories?.map((cat) => ({
      value: cat.name as string,
      label: cat.name as string,
    })) ?? []),
  ];

  const subcategories = userTransactionCategories
    ?.find((cat) => cat.name === category)
    ?.subcategories?.filter((sub) => sub.name)
    .sort((a, b) =>
      (a.name as string).localeCompare(b.name as string),
    );

  const subcategoryOptions: ComboboxOption[] = [
    {
      value: ADD_NEW_VALUE,
      label: "Add a new subcategory",
      icon: <AddAlt className="mr-2 h-4 w-4" />,
    },
    ...(subcategories?.map((sub) => ({
      value: sub.name as string,
      label: sub.name as string,
    })) ?? []),
  ];

  return (
    <>
      {/* Category */}
      <Controller
        control={form.control}
        name="category"
        render={({ field: controllerField }) => (
          <FormItem
            className={cn({
              "border rounded-lg p-4": isAddingNewCategory,
            })}
          >
            <FormLabel>Category</FormLabel>
            <Combobox
              options={categoryOptions}
              value={isAddingNewCategory ? ADD_NEW_VALUE : controllerField.value || ""}
              onValueChange={(value) => {
                if (value === ADD_NEW_VALUE) {
                  setIsAddingNewCategory(true);
                  setNewCategory("");
                  controllerField.onChange("");
                } else {
                  setIsAddingNewCategory(false);
                  setNewCategory("");
                  controllerField.onChange(value);
                }
              }}
              placeholder="Select a category"
              searchPlaceholder="Search categories..."
              emptyText="No categories found."
            />

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
            <FormMessage aria-live="polite" />
          </FormItem>
        )}
      />
      {/* Subcategory */}
      <Controller
        control={form.control}
        name="subcategory"
        render={({ field: controllerField }) => (
          <FormItem
            className={cn({
              "border rounded-lg p-4": isAddingNewSubcategory,
            })}
          >
            <FormLabel>Subcategory</FormLabel>
            <Combobox
              options={subcategoryOptions}
              value={isAddingNewSubcategory ? ADD_NEW_VALUE : controllerField.value || ""}
              onValueChange={(value) => {
                if (value === ADD_NEW_VALUE) {
                  setIsAddingNewSubcategory(true);
                  setNewSubcategory("");
                  controllerField.onChange("");
                } else {
                  setIsAddingNewSubcategory(false);
                  setNewSubcategory("");
                  controllerField.onChange(value);
                }
              }}
              disabled={!category}
              placeholder={category ? "Select a subcategory" : "Select a category first"}
              searchPlaceholder="Search subcategories..."
              emptyText="No subcategories found."
            />

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
            <FormMessage aria-live="polite" />
          </FormItem>
        )}
      />
    </>
  );
}
