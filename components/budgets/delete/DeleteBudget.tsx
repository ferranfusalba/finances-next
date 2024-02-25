"use client";
import { BudgetParamsProps } from "@/types/Budget";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteBudget({ params }: BudgetParamsProps) {
  const router = useRouter();

  return (
    <>
      <Button
        variant="destructive"
        onClick={async () => {
          await fetch(`/api/budgets/${params.id}`, {
            method: "DELETE",
          });
          router.push("/budgets/");
          router.refresh();
        }}
      >
        <TrashCan />
      </Button>
    </>
  );
}
