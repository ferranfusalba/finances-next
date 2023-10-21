"use client";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

type ParamsProps = {
  params: {
    id: string;
  };
};

export default function DeleteBudget({ params }: ParamsProps) {
  const router = useRouter();

  return (
    <>
      <button
        onClick={async () => {
          await fetch(`/api/budgets/${params.id}`, {
            method: "DELETE",
          });
          router.push("/budgets/");
          router.refresh();
        }}
      >
        <TrashCan />
      </button>
    </>
  );
}
