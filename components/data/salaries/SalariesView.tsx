"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import SalariesTable from "./SalariesTable";
import type { SalaryTransaction } from "./SalariesTable";
import SalariesChartVisx from "./SalariesChartVisx";
import SalariesChartCarbon from "./SalariesChartCarbon";
import SalaryFormDialog from "./SalaryFormDialog";
import type { Salary } from "@/types/Salary";

interface Props {
  salaries: Salary[];
  transactions: SalaryTransaction[];
  existingEmployers: string[];
  existingGroups: string[];
  existingConcepts: string[];
  accountMap: Record<string, string>;
  userLocale: string;
  defaultCurrency: string;
}

export default function SalariesView({
  salaries,
  transactions,
  existingEmployers,
  existingGroups,
  existingConcepts,
  accountMap,
  userLocale,
  defaultCurrency,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editingMonthKey, setEditingMonthKey] = useState("");
  const [editingTransactions, setEditingTransactions] = useState<
    SalaryTransaction[]
  >([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Salary | null>(null);

  const handleEditSalary = (
    monthKey: string,
    salary: Salary | null,
    monthTransactions: SalaryTransaction[],
  ) => {
    setEditingMonthKey(monthKey);
    setEditingSalary(salary);
    setEditingTransactions(monthTransactions);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/salaries/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete salary details");
        return;
      }
      toast.success("Salary details removed");
      setDeleteConfirm(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete salary details");
    }
  };

  return (
    <>
      <SalariesTable
        transactions={transactions}
        salaries={salaries}
        accountMap={accountMap}
        userLocale={userLocale}
        onEditSalary={handleEditSalary}
      />
      <br />
      <SalariesChartVisx
        salaries={salaries}
        accountMap={accountMap}
        userLocale={userLocale}
      />
      <br />
      <br />
      <SalariesChartCarbon
        salaries={salaries}
        accountMap={accountMap}
        userLocale={userLocale}
      />

      <SalaryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        salary={editingSalary}
        monthKey={editingMonthKey}
        monthTransactions={editingTransactions}
        allSalaries={salaries}
        existingEmployers={existingEmployers}
        existingGroups={existingGroups}
        existingConcepts={existingConcepts}
        accountMap={accountMap}
        userLocale={userLocale}
        defaultCurrency={defaultCurrency}
        onDelete={
          editingSalary
            ? () => {
                setFormOpen(false);
                setDeleteConfirm(editingSalary);
              }
            : undefined
        }
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Salary Details</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the salary details (gross pay,
              deductions) for{" "}
              {deleteConfirm &&
                new Date(deleteConfirm.month).toLocaleDateString(userLocale, {
                  month: "long",
                  year: "numeric",
                })}
              ? The underlying transactions will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
