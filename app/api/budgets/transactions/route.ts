import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const data = await request.json();

  try {
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
        foreignCurrency: data.foreignCurrency,
        foreignCurrencyAmount: data.foreignCurrencyAmount,
        foreignCurrencyExchangeRate: data.foreignCurrencyExchangeRate,
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags,
        dateTime: data.dateTime,
        timezone: data.timezone,
        location: data.location,
        notes: data.notes,
        budgetId: data.budgetId,
      },
    });

    return NextResponse.json(newTransaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
