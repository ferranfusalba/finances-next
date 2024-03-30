import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: any) {
  const data = await request.json();

  const newTransaction = await db.budgetTransaction.create({
    data: {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      concept: data.concept,
      type: data.type,
      currency: data.currency,
      amount: data.amount,
      balance: data.balance,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags,
      notes: data.notes,
      budgetId: data.budgetId,
    },
  });

  return NextResponse.json(newTransaction);
}
