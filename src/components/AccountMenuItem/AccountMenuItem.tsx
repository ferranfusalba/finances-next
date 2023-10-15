"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountMenuItem({ account }: { account: any }) {
  const router = useRouter();

  return (
    <li key={account.id}>
      <Link href={"/accounts/" + account.id}>Account {account.id}</Link>{" "}
      <button
        onClick={async () => {
          const res = await fetch(`/api/accounts/${account.id}`, {
            method: "DELETE",
          });
          router.refresh();
        }}
      >
        Delete
      </button>
    </li>
  );
}
