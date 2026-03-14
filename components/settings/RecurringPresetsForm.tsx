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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubcategoryItem {
  id: string;
  name: string;
  recurring: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  recurring: string | null;
  subcategories: SubcategoryItem[];
}

export default function RecurringPresetsForm({
  categories: initialCategories,
}: {
  categories: CategoryItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();

  function updateRecurring(
    type: "category" | "subcategory",
    id: string,
    recurring: string | null,
  ) {
    const body =
      type === "subcategory"
        ? { subcategoryId: id, recurring }
        : { categoryId: id, recurring };

    startTransition(async () => {
      try {
        const res = await fetch("/api/user/transaction-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to update");
          return;
        }

        setCategories((prev) =>
          prev.map((c) => {
            if (type === "category" && c.id === id) {
              return { ...c, recurring };
            }
            if (type === "subcategory") {
              return {
                ...c,
                subcategories: c.subcategories.map((s) =>
                  s.id === id ? { ...s, recurring } : s,
                ),
              };
            }
            return c;
          }),
        );

        const label = recurring
          ? recurring === "YEARLY"
            ? "yearly"
            : "monthly"
          : "not recurring";
        toast.success(`Updated to ${label}`);
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Payment Presets</CardTitle>
        <CardDescription>
          Set which categories or subcategories should auto-mark transactions as
          recurring. Subcategory presets override category presets. You can still
          change it per transaction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No categories found. Create categories by adding transactions.
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium flex-1">{cat.name}</span>
              <Select
                value={cat.recurring ?? "NONE"}
                onValueChange={(val) =>
                  updateRecurring(
                    "category",
                    cat.id,
                    val === "NONE" ? null : val,
                  )
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not recurring</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cat.subcategories.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 pl-6">
                <span className="text-sm text-muted-foreground flex-1">
                  {sub.name}
                </span>
                <Select
                  value={sub.recurring ?? "INHERIT"}
                  onValueChange={(val) =>
                    updateRecurring(
                      "subcategory",
                      sub.id,
                      val === "INHERIT" ? null : val,
                    )
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INHERIT">Inherit</SelectItem>
                    <SelectItem value="NONE">Not recurring</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
