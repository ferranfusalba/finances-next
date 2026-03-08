"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Add, Close, TrashCan } from "@carbon/icons-react";

interface SubcategoryPreset {
  id: string;
  name: string;
  categoryId: string;
  defaultTaxRate: number | null;
}

interface CategoryPreset {
  id: string;
  name: string;
  defaultTaxRate: number | null;
  subcategories: SubcategoryPreset[];
}

// Flat item for preset groups — either a category or subcategory
interface PresetItem {
  type: "category" | "subcategory";
  id: string;
  label: string; // display name, e.g. "Transport" or "Transport > T-Jove"
  categoryName: string;
  subcategoryName?: string;
}

export default function TaxPresetsForm({
  categories: initialCategories,
  defaultTaxRate: initialDefaultTaxRate,
}: {
  categories: CategoryPreset[];
  defaultTaxRate: number;
}) {
  const [defaultTaxRate, setDefaultTaxRate] = useState(initialDefaultTaxRate);
  const [defaultRateInput, setDefaultRateInput] = useState(
    String(initialDefaultTaxRate),
  );
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [newRate, setNewRate] = useState("");

  // Build flat list of all assigned items grouped by rate
  const presetGroups = useMemo(() => {
    const groups = new Map<number, PresetItem[]>();
    for (const cat of categories) {
      if (cat.defaultTaxRate !== null && !cat.id.startsWith("__empty_")) {
        const rate = cat.defaultTaxRate;
        if (!groups.has(rate)) groups.set(rate, []);
        groups.get(rate)!.push({
          type: "category",
          id: cat.id,
          label: cat.name,
          categoryName: cat.name,
        });
      }
      for (const sub of cat.subcategories) {
        if (sub.defaultTaxRate !== null) {
          const rate = sub.defaultTaxRate;
          if (!groups.has(rate)) groups.set(rate, []);
          groups.get(rate)!.push({
            type: "subcategory",
            id: sub.id,
            label: `${cat.name} \u203A ${sub.name}`,
            categoryName: cat.name,
            subcategoryName: sub.name,
          });
        }
      }
    }
    // Also include empty placeholder groups
    for (const cat of categories) {
      if (cat.id.startsWith("__empty_") && cat.defaultTaxRate !== null) {
        if (!groups.has(cat.defaultTaxRate)) {
          groups.set(cat.defaultTaxRate, []);
        }
      }
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [categories]);

  // Build flat list of unassigned items for the "Add" dropdown
  const unassignedItems = useMemo(() => {
    const items: { value: string; label: string; indent: boolean }[] = [];
    const assignedCatIds = new Set(
      categories
        .filter((c) => c.defaultTaxRate !== null && !c.id.startsWith("__empty_"))
        .map((c) => c.id),
    );
    const assignedSubIds = new Set(
      categories.flatMap((c) =>
        c.subcategories
          .filter((s) => s.defaultTaxRate !== null)
          .map((s) => s.id),
      ),
    );

    for (const cat of categories) {
      if (cat.id.startsWith("__empty_")) continue;
      if (!assignedCatIds.has(cat.id)) {
        items.push({
          value: `cat:${cat.id}`,
          label: cat.name,
          indent: false,
        });
      }
      for (const sub of cat.subcategories) {
        if (!assignedSubIds.has(sub.id)) {
          items.push({
            value: `sub:${sub.id}`,
            label: `${cat.name} \u203A ${sub.name}`,
            indent: true,
          });
        }
      }
    }
    return items;
  }, [categories]);

  function updateItem(value: string, rate: number | null) {
    const [type, id] = value.split(":");

    // Capture current rate before updating (used in success message on removal)
    let previousRate: number | null = null;
    if (rate === null) {
      for (const cat of categories) {
        if (type === "cat" && cat.id === id) { previousRate = cat.defaultTaxRate; break; }
        for (const sub of cat.subcategories) {
          if (type === "sub" && sub.id === id) { previousRate = sub.defaultTaxRate; break; }
        }
        if (previousRate !== null) break;
      }
    }

    const body =
      type === "sub"
        ? { subcategoryId: id, defaultTaxRate: rate }
        : { categoryId: id, defaultTaxRate: rate };

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

        const updated = await res.json();
        const newRate =
          updated.defaultTaxRate !== null
            ? Number(updated.defaultTaxRate)
            : null;

        setCategories((prev) =>
          prev.map((c) => {
            if (type === "cat" && c.id === id) {
              return { ...c, defaultTaxRate: newRate };
            }
            if (type === "sub") {
              return {
                ...c,
                subcategories: c.subcategories.map((s) =>
                  s.id === id ? { ...s, defaultTaxRate: newRate } : s,
                ),
              };
            }
            return c;
          }),
        );

        const label = findLabel(type, id);
        if (rate !== null) {
          toast.success(`Added ${label} to ${rate}% preset`);
        } else {
          toast.success(`Removed ${label} from ${previousRate}% preset`);
        }
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  function findLabel(type: string, id: string): string {
    for (const cat of categories) {
      if (type === "cat" && cat.id === id) return cat.name;
      for (const sub of cat.subcategories) {
        if (type === "sub" && sub.id === id)
          return `${cat.name} \u203A ${sub.name}`;
      }
    }
    return "";
  }

  function handleAddPresetGroup() {
    const parsed = parseFloat(newRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Enter a valid rate between 0 and 100");
      return;
    }
    if (presetGroups.some(([rate]) => rate === parsed)) {
      toast.error(`A preset for ${parsed}% already exists`);
      return;
    }
    setCategories((prev) => [
      ...prev,
      {
        id: `__empty_${parsed}`,
        name: "",
        defaultTaxRate: parsed,
        subcategories: [],
      },
    ]);
    setNewRate("");
  }

  function handleRemovePresetGroup(rate: number) {
    // Collect all real items in this group
    const itemsToRemove: { type: string; id: string }[] = [];
    for (const cat of categories) {
      if (
        cat.defaultTaxRate === rate &&
        !cat.id.startsWith("__empty_")
      ) {
        itemsToRemove.push({ type: "cat", id: cat.id });
      }
      for (const sub of cat.subcategories) {
        if (sub.defaultTaxRate === rate) {
          itemsToRemove.push({ type: "sub", id: sub.id });
        }
      }
    }

    if (itemsToRemove.length === 0) {
      setCategories((prev) =>
        prev.filter(
          (c) =>
            !(c.id.startsWith("__empty_") && c.defaultTaxRate === rate),
        ),
      );
      return;
    }

    startTransition(async () => {
      try {
        for (const item of itemsToRemove) {
          const body =
            item.type === "sub"
              ? { subcategoryId: item.id, defaultTaxRate: null }
              : { categoryId: item.id, defaultTaxRate: null };
          const res = await fetch("/api/user/transaction-categories", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || "Failed to remove preset group");
            return;
          }
        }

        setCategories((prev) =>
          prev
            .filter(
              (c) =>
                !(
                  c.id.startsWith("__empty_") && c.defaultTaxRate === rate
                ),
            )
            .map((c) => ({
              ...c,
              defaultTaxRate:
                c.defaultTaxRate === rate ? null : c.defaultTaxRate,
              subcategories: c.subcategories.map((s) => ({
                ...s,
                defaultTaxRate:
                  s.defaultTaxRate === rate ? null : s.defaultTaxRate,
              })),
            })),
        );
        toast.success(`Removed ${rate}% preset group`);
      } catch {
        toast.error("Failed to remove preset group");
      }
    });
  }

  function handleSaveDefaultRate() {
    const parsed = parseFloat(defaultRateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Enter a valid rate between 0 and 100");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/user/settings/default-tax-rate", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultTaxRate: parsed }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to update");
          return;
        }
        setDefaultTaxRate(parsed);
        toast.success(`Default tax rate set to ${parsed}%`);
      } catch {
        toast.error("Failed to update default rate");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Presets</CardTitle>
        <CardDescription>
          Set default sales tax rates and assign categories or subcategories to
          each. When creating a transaction, the tax rate auto-fills based on
          the selected category/subcategory. Subcategory presets take priority
          over category presets. Items without a preset use the general rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 border rounded-lg p-4">
          <span className="flex-1 text-sm font-semibold">
            General sales tax
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={100}
            className="w-24"
            value={defaultRateInput}
            onChange={(e) => setDefaultRateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveDefaultRate();
              }
            }}
            disabled={isPending}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleSaveDefaultRate}
          >
            Save
          </Button>
        </div>

        {presetGroups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No category-specific presets. All categories use {defaultTaxRate}%.
          </p>
        )}

        {presetGroups.map(([rate, items]) => (
          <div key={rate} className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{rate}%</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleRemovePresetGroup(rate)}
              >
                <TrashCan className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {items.map((item) => (
                <Badge
                  key={`${item.type}-${item.id}`}
                  variant="secondary"
                  className="gap-1 pr-1 select-none"
                >
                  {item.label}
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    disabled={isPending}
                    onClick={() =>
                      updateItem(`${item.type === "subcategory" ? "sub" : "cat"}:${item.id}`, null)
                    }
                    className="rounded-full hover:bg-muted-foreground/20"
                  >
                    <Close className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {unassignedItems.length > 0 && (
                <Select
                  value=""
                  onValueChange={(val) => updateItem(val, rate)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-auto h-6 border-dashed text-xs gap-1 px-2">
                    <Add className="h-3 w-3" />
                    <SelectValue placeholder="Add" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        className={item.indent ? "pl-8" : ""}
                      >
                        {item.indent ? `\u2014 ${item.label.split("\u203A")[1]?.trim()}` : item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={100}
            className="w-24"
            placeholder="10"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPresetGroup();
              }
            }}
            disabled={isPending}
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || !newRate}
            onClick={handleAddPresetGroup}
          >
            <Add className="h-4 w-4 mr-1" />
            Add preset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
