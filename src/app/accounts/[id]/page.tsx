"use client";
import { TrashCan } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

type ParamsProps = {
  params: {
    id: string;
  };
};

export default function AccountLayout({ params }: ParamsProps) {
  const router = useRouter();

  return (
    <>
      Account id: {params.id}
      <button
        onClick={async () => {
          await fetch(`/api/accounts/${params.id}`, {
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
