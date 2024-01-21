"use client";
import { AccountParamsProps } from "@/types/Account";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

export default function DeleteAccount({ params }: AccountParamsProps) {
  const router = useRouter();

  return (
    <>
      <button
        onClick={async () => {
          await fetch(`/api/accounts/${params.code}`, {
            method: "DELETE",
          });
          router.push("/accounts/");
          router.refresh();
        }}
      >
        <TrashCan />
      </button>
    </>
  );
}
