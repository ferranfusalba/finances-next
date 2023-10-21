"use client";
import Link from "next/link";

export default function BudgettMenuItem({ budget }: { budget: any }) {
  return (
    <li
      key={budget.id}
      className="border-2 border-white flex justify-center items-center min-w-10rem mx-2.5"
    >
      <Link href={"/budgets/" + budget.id}>Budget {budget.id}</Link>{" "}
    </li>
  );
}
