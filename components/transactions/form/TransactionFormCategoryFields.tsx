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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useTransactionUser } from "@/contexts/TransactionUserContext";
import { cn } from "@/lib/utils";

interface Props {
  variant: "account" | "budget";
}

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

  return (
    <>
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
              <FormLabel>Category</FormLabel>
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
                        {(() => {
                          const categories = userTransactionCategories
                            ?.filter((cat) => cat.name)
                            .sort((a, b) =>
                              (a.name as string).localeCompare(
                                b.name as string,
                              ),
                            );
                          if (!categories?.length) {
                            return (
                              <p className="text-sm text-muted-foreground text-center py-2 select-none">
                                No categories yet
                              </p>
                            );
                          }
                          return categories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.name as string}
                            >
                              {cat.name}
                            </SelectItem>
                          ));
                        })()}
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
                        disabled={!category}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={category ? "Select a subcategory" : "Select a category first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__new__">
                            Add a new subcategory
                          </SelectItem>
                          <Separator className="my-2 px-2" />
                          {(() => {
                            const subcategories = userTransactionCategories
                              ?.find((cat) => cat.name === category)
                              ?.subcategories?.filter((sub) => sub.name)
                              .sort((a, b) =>
                                (a.name as string).localeCompare(
                                  b.name as string,
                                ),
                              );
                            if (!subcategories?.length) {
                              return (
                                <p className="text-sm text-muted-foreground text-center py-2 select-none">
                                  No subcategories yet
                                </p>
                              );
                            }
                            return subcategories.map((sub) => (
                              <SelectItem
                                key={sub.id}
                                value={sub.name as string}
                              >
                                {sub.name}
                              </SelectItem>
                            ));
                          })()}
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
    </>
  );
}
