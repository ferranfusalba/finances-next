"use client";
import { useState, useTransition } from "react";
import { AccountParamsProps } from "@/types/Account";
import { TrashCan } from "@carbon/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DeleteAccount({ params }: AccountParamsProps) {
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
