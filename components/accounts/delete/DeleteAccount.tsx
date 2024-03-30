"use client";

import { useState, useTransition } from "react";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export default function DeleteAccount({ params }: AccountBudgetParamsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOnClick = async () => {
    startTransition(async () => {
      await fetch(`/api/accounts/${params.id}`, {
        method: "DELETE",
      });
      router.push("/accounts/");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <TrashCan />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
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
