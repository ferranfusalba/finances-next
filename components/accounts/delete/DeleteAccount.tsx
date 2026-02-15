"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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

export default function DeleteAccount({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOnClick = async () => {
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Account deleted successfully");
        router.push("/accounts/");
        router.refresh();
      } else {
        const json = await res.json();
        toast("Failed to delete account", {
          description: json.error ?? "Unknown error",
        });
      }
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
