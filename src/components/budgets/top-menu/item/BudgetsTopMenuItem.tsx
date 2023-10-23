"use client";
import { Budget } from "@/types/Budget";
import Link from "next/link";

export default function BudgettMenuItem({ budget }: { budget: Budget }) {
  return (
    <li
      key={budget.id}
      className="border-2 border-white flex justify-center items-center min-w-10rem mx-2.5 px-4"
    >
      <Link href={"/budgets/" + budget.id}>{budget.name}</Link>{" "}
    </li>
  );
}
