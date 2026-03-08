"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DeleteBudget({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOnClick = async () => {
    startTransition(async () => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Budget deleted successfully");
        router.push("/budgets/");
        router.refresh();
      } else {
        const json = await res.json();
        toast.error("Failed to delete budget", {
          description: json.error ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" aria-label="Delete budget">
          <TrashCan />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Budget</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            budget and all its transactions.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={handleOnClick}
        >
          Confirm
        </Button>
      </DialogContent>
    </Dialog>
  );
}
