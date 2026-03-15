"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AddAlt } from "@carbon/icons-react";

import {
  CATEGORY_PALETTE,
  deriveSubcategoryColor,
} from "@/lib/utils/categoryColors";
import type { CategoryType } from "@/lib/utils/categoryType";

interface SubcategoryItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  color: string;
  subcategories: SubcategoryItem[];
}

const SECTIONS: { type: CategoryType; label: string }[] = [
  { type: "INCOME", label: "Income" },
  { type: "EXPENSE", label: "Expense" },
  { type: "TRANSFER", label: "Transfer" },
];

export default function CategorySettingsForm({
  categories: initialCategories,
}: {
  categories: CategoryItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [newCategoryNames, setNewCategoryNames] = useState<
    Record<string, string>
  >({ INCOME: "", EXPENSE: "", TRANSFER: "" });

  function updateColor(categoryId: string, color: string) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/transaction-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, color }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to update color");
          return;
        }

        setCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? { ...c, color } : c)),
        );
      } catch {
        toast.error("Failed to update color");
      }
    });
  }

  function updateType(categoryId: string, newType: CategoryType, oldName: string) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/transaction-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, type: newType }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to update type");
          return;
        }

        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId ? { ...c, type: newType } : c,
          ),
        );
        toast.success(`${oldName} moved to ${newType.toLowerCase()}`);
      } catch {
        toast.error("Failed to update type");
      }
    });
  }

  function addCategory(type: CategoryType) {
    const name = newCategoryNames[type]?.trim();
    if (!name) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/user/transaction-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to add category");
          return;
        }

        const created = await res.json();
        setCategories((prev) =>
          [
            ...prev,
            { ...created, subcategories: [] },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNewCategoryNames((prev) => ({ ...prev, [type]: "" }));
        toast.success(`${name} added`);
      } catch {
        toast.error("Failed to add category");
      }
    });
  }

  return (
    <>
      {SECTIONS.map(({ type, label }) => {
        const sectionCategories = categories.filter((c) => c.type === type);

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{label} Categories</CardTitle>
              <CardDescription>
                Manage categories for {label.toLowerCase()} transactions. Click a
                color swatch to change it. Changing a category&apos;s type will
                update all existing transactions in that category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sectionCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No {label.toLowerCase()} categories yet.
                </p>
              )}
              {sectionCategories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={cat.color}
                      onChange={(color) => updateColor(cat.id, color)}
                      disabled={isPending}
                    />
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    <Select
                      value={cat.type}
                      onValueChange={(val) =>
                        updateType(cat.id, val as CategoryType, cat.name)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {cat.subcategories.map((sub, index) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 pl-6"
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 border border-border"
                        style={{
                          backgroundColor: `#${deriveSubcategoryColor(cat.color, index)}`,
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {sub.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder={`New ${label.toLowerCase()} category`}
                  value={newCategoryNames[type]}
                  onChange={(e) =>
                    setNewCategoryNames((prev) => ({
                      ...prev,
                      [type]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory(type);
                    }
                  }}
                  className="max-w-xs"
                  disabled={isPending}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addCategory(type)}
                  disabled={isPending || !newCategoryNames[type]?.trim()}
                >
                  <AddAlt className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

function ColorPicker({
  color,
  onChange,
  disabled,
}: {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-5 h-5 rounded-full shrink-0 border border-border cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-shadow disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: `#${color}` }}
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className="w-6 h-6 rounded-full border border-border cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-shadow"
              style={{
                backgroundColor: `#${c}`,
                outline: c === color ? "2px solid currentColor" : undefined,
                outlineOffset: "2px",
              }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
