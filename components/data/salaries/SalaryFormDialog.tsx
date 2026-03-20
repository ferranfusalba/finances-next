"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Add, AddAlt, Copy, TrashCan } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import type { Salary } from "@/types/Salary";
import type { SalaryTransaction } from "./SalariesTable";

const ADD_NEW_VALUE = "__new__";

interface SalaryLineForm {
  concept: string;
  group: string;
  amount: string;
  order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salary: Salary | null;
  allSalaries: Salary[];
  monthKey: string;
  monthTransactions: SalaryTransaction[];
  existingEmployers: string[];
  existingGroups: string[];
  existingConcepts: string[];
  accountMap: Record<string, string>;
  userLocale: string;
  defaultCurrency: string;
  onDelete?: () => void;
}

export default function SalaryFormDialog({
  open,
  onOpenChange,
  salary,
  allSalaries,
  monthKey,
  monthTransactions,
  existingEmployers,
  existingGroups,
  existingConcepts,
  accountMap,
  userLocale,
  defaultCurrency,
  onDelete,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!salary;

  // Form state
  const [employer, setEmployer] = useState("");
  const [isAddingNewEmployer, setIsAddingNewEmployer] = useState(false);
  const [newEmployer, setNewEmployer] = useState("");
  const [grossPay, setGrossPay] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SalaryLineForm[]>([]);

  // Track new group/concept additions per line
  const [addingNewGroup, setAddingNewGroup] = useState<Record<number, boolean>>({});
  const [newGroupValues, setNewGroupValues] = useState<Record<number, string>>({});
  const [addingNewConcept, setAddingNewConcept] = useState<Record<number, boolean>>({});
  const [newConceptValues, setNewConceptValues] = useState<Record<number, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (salary) {
      setEmployer(salary.employer);
      setIsAddingNewEmployer(false);
      setNewEmployer("");
      setGrossPay(String(salary.grossPay));
      setCurrency(salary.currency);
      setNotes(salary.notes);
      setLines(
        salary.lines.map((l) => ({
          concept: l.concept,
          group: l.group,
          amount: String(Math.abs(l.amount)),
          order: l.order,
        })),
      );
    } else {
      // Pre-populate employer from transaction payee
      const payee = monthTransactions[0]?.payee ?? "";
      setEmployer("");
      setIsAddingNewEmployer(false);
      setNewEmployer("");
      setGrossPay("");
      setCurrency(monthTransactions[0]?.currency ?? defaultCurrency);
      setNotes("");
      setLines([]);
      // If all transactions have the same payee and it exists in employers, pre-select
      if (payee && existingEmployers.includes(payee)) {
        setEmployer(payee);
      }
    }
    setAddingNewGroup({});
    setNewGroupValues({});
    setAddingNewConcept({});
    setNewConceptValues({});
  }, [open, salary, monthTransactions, defaultCurrency, existingEmployers]);

  const monthLabel = monthKey
    ? (() => {
        const [y, m] = monthKey.split("-");
        const dt = new Date(Number(y), Number(m) - 1);
        return dt.toLocaleString(userLocale, { month: "long", year: "numeric" });
      })()
    : "";

  // Find the previous month's salary for copy feature
  const previousSalary = useMemo(() => {
    if (!monthKey) return null;
    const [y, m] = monthKey.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1); // month is 0-indexed, so m-1 is current, m-2 is previous
    return (
      allSalaries.find((s) => {
        const sd = new Date(s.month);
        return sd.getFullYear() === prevDate.getFullYear() && sd.getMonth() === prevDate.getMonth();
      }) ?? null
    );
  }, [monthKey, allSalaries]);

  const copyFromPrevious = () => {
    if (!previousSalary) return;
    setEmployer(previousSalary.employer);
    setIsAddingNewEmployer(false);
    setGrossPay(String(previousSalary.grossPay));
    setCurrency(previousSalary.currency);
    setLines(
      previousSalary.lines.map((l) => ({
        concept: l.concept,
        group: l.group,
        amount: String(Math.abs(l.amount)),
        order: l.order,
      })),
    );
    setAddingNewGroup({});
    setNewGroupValues({});
    setAddingNewConcept({});
    setNewConceptValues({});
  };

  const netFromTransactions = monthTransactions.reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  );

  // Combine existing values with newly-added ones from current lines
  const allGroups = new Set(existingGroups);
  const allConcepts = new Set(existingConcepts);
  for (const line of lines) {
    if (line.group) allGroups.add(line.group);
    if (line.concept) allConcepts.add(line.concept);
  }
  const groupOptions: ComboboxOption[] = [
    { value: ADD_NEW_VALUE, label: "Add new group", icon: <AddAlt /> },
    ...Array.from(allGroups)
      .sort()
      .map((g) => ({ value: g, label: g })),
  ];
  const conceptOptions: ComboboxOption[] = [
    { value: ADD_NEW_VALUE, label: "Add new concept", icon: <AddAlt /> },
    ...Array.from(allConcepts)
      .sort()
      .map((c) => ({ value: c, label: c })),
  ];

  const employerOptions: ComboboxOption[] = [
    { value: ADD_NEW_VALUE, label: "Add new employer", icon: <AddAlt /> },
    ...existingEmployers.map((e) => ({ value: e, label: e })),
  ];

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { concept: "", group: "", amount: "", order: prev.length },
    ]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setAddingNewGroup((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setNewGroupValues((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setAddingNewConcept((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setNewConceptValues((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateLine = (index: number, field: keyof SalaryLineForm, value: string) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  };

  const totalDeductions = lines.reduce(
    (sum, l) => sum + (parseFloat(l.amount) || 0),
    0,
  );
  const gross = parseFloat(grossPay) || 0;
  const computedNet = gross > 0 ? gross - totalDeductions : 0;

  const fmt = (value: number) =>
    new Intl.NumberFormat(userLocale, {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);

  const handleSubmit = () => {
    const resolvedEmployer = isAddingNewEmployer ? newEmployer : employer;

    if (!resolvedEmployer || !grossPay) {
      toast.error("Employer and gross pay are required");
      return;
    }

    const monthDate = new Date(`${monthKey}-01T00:00:00.000Z`);

    const resolvedLines = lines
      .filter((l) => l.concept && l.group && l.amount)
      .map((l, i) => ({
        concept: l.concept,
        group: l.group,
        amount: parseFloat(l.amount),
        order: i,
      }));

    // Auto-link all transactions for this month
    const payments = monthTransactions.map((t) => ({
      transactionId: t.id,
      concept: "",
    }));

    const payload = {
      month: monthDate.toISOString(),
      employer: resolvedEmployer,
      grossPay: gross,
      currency,
      notes,
      lines: resolvedLines,
      payments,
    };

    startTransition(async () => {
      try {
        const url = isEditing ? `/api/salaries/${salary.id}` : "/api/salaries";
        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to save salary");
          return;
        }

        toast.success(isEditing ? "Salary updated" : "Salary details added");
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("Failed to save salary");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Salary" : "Add Salary Details"} — {monthLabel}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update gross pay, deductions, and employer."
              : "Add gross pay and deduction breakdown for this month."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Net from transactions (read-only context) */}
          <div className="rounded bg-slate-800 p-3 text-sm">
            <span className="text-slate-400">
              Net received ({monthTransactions.length} transaction
              {monthTransactions.length !== 1 ? "s" : ""}):
            </span>{" "}
            <span className="font-semibold">{fmt(netFromTransactions)}</span>
            <div className="mt-1 text-xs text-slate-500">
              {monthTransactions.map((t) => {
                const account = accountMap[t.accountId] ?? "";
                return (
                  <div key={t.id}>
                    {t.payee || t.concept} · {account} · {fmt(Math.abs(t.amount))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy from previous month */}
          {!isEditing && previousSalary && lines.length === 0 && (
            <button
              type="button"
              onClick={copyFromPrevious}
              className="flex items-center gap-2 w-full rounded border border-dashed border-slate-600 p-3 text-sm text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors"
            >
              <Copy size={16} />
              Copy from{" "}
              {new Date(previousSalary.month).toLocaleString(userLocale, {
                month: "long",
              })}
              {" "}({previousSalary.employer} · {previousSalary.lines.length} deductions)
            </button>
          )}

          {/* Employer */}
          <div>
            <label className="text-sm font-medium">Employer</label>
            {isAddingNewEmployer ? (
              <div className="flex gap-2">
                <Input
                  placeholder="New employer name"
                  value={newEmployer}
                  onChange={(e) => setNewEmployer(e.target.value)}
                  className="border-blue-500"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingNewEmployer(false);
                    setNewEmployer("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Combobox
                options={employerOptions}
                value={employer}
                onValueChange={(val) => {
                  if (val === ADD_NEW_VALUE) {
                    setIsAddingNewEmployer(true);
                    setEmployer("");
                  } else {
                    setEmployer(val);
                  }
                }}
                placeholder="Select employer"
                searchPlaceholder="Search employers..."
              />
            )}
          </div>

          {/* Gross Pay + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium">Gross Pay</label>
              <Input
                type="number"
                step="0.01"
                value={grossPay}
                onChange={(e) => setGrossPay(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium">Currency</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="EUR"
                maxLength={3}
              />
            </div>
          </div>

          {/* Deduction Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Deductions</label>
              <Button variant="ghost" size="sm" onClick={addLine}>
                <Add className="mr-1" size={16} /> Add Line
              </Button>
            </div>
            {lines.length === 0 && (
              <p className="text-sm text-slate-400">No deduction lines yet.</p>
            )}
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  {i === 0 && (
                    <label className="text-xs text-slate-400">Concept</label>
                  )}
                  {addingNewConcept[i] ? (
                    <Input
                      placeholder="New concept"
                      value={newConceptValues[i] ?? ""}
                      onChange={(e) =>
                        setNewConceptValues((prev) => ({
                          ...prev,
                          [i]: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        const val = newConceptValues[i]?.trim();
                        if (val) updateLine(i, "concept", val);
                        setAddingNewConcept((prev) => ({ ...prev, [i]: false }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = newConceptValues[i]?.trim();
                          if (val) updateLine(i, "concept", val);
                          setAddingNewConcept((prev) => ({ ...prev, [i]: false }));
                        }
                      }}
                      className="border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <Combobox
                      options={conceptOptions}
                      value={line.concept}
                      onValueChange={(val) => {
                        if (val === ADD_NEW_VALUE) {
                          setAddingNewConcept((prev) => ({ ...prev, [i]: true }));
                          setNewConceptValues((prev) => ({ ...prev, [i]: "" }));
                          updateLine(i, "concept", "");
                        } else {
                          updateLine(i, "concept", val);
                        }
                      }}
                      placeholder="Concept"
                      searchPlaceholder="Search concepts..."
                    />
                  )}
                </div>
                <div className="flex-1">
                  {i === 0 && (
                    <label className="text-xs text-slate-400">Group</label>
                  )}
                  {addingNewGroup[i] ? (
                    <Input
                      placeholder="New group"
                      value={newGroupValues[i] ?? ""}
                      onChange={(e) =>
                        setNewGroupValues((prev) => ({
                          ...prev,
                          [i]: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        const val = newGroupValues[i]?.trim();
                        if (val) updateLine(i, "group", val);
                        setAddingNewGroup((prev) => ({ ...prev, [i]: false }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = newGroupValues[i]?.trim();
                          if (val) updateLine(i, "group", val);
                          setAddingNewGroup((prev) => ({ ...prev, [i]: false }));
                        }
                      }}
                      className="border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <Combobox
                      options={groupOptions}
                      value={line.group}
                      onValueChange={(val) => {
                        if (val === ADD_NEW_VALUE) {
                          setAddingNewGroup((prev) => ({ ...prev, [i]: true }));
                          setNewGroupValues((prev) => ({ ...prev, [i]: "" }));
                          updateLine(i, "group", "");
                        } else {
                          updateLine(i, "group", val);
                        }
                      }}
                      placeholder="Group"
                      searchPlaceholder="Search groups..."
                    />
                  )}
                </div>
                <div className="w-28">
                  {i === 0 && (
                    <label className="text-xs text-slate-400">Amount</label>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={line.amount}
                    onChange={(e) => updateLine(i, "amount", e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(i)}
                  className="shrink-0"
                >
                  <TrashCan size={16} />
                </Button>
              </div>
            ))}
            {(lines.length > 0 || gross > 0) && (
              <div className="text-sm text-slate-300 mt-2 space-y-1">
                {gross > 0 && (
                  <div>
                    Total deductions: {fmt(-totalDeductions)} · Computed net:{" "}
                    {fmt(computedNet)}
                  </div>
                )}
                {gross > 0 && Math.abs(computedNet - netFromTransactions) > 0.01 && (
                  <div className="text-yellow-400">
                    Computed net differs from received amount by{" "}
                    {fmt(computedNet - netFromTransactions)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="mr-auto">
              Remove Details
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
