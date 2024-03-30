import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function GET(request: any, { params }: AccountBudgetParamsProps) {
  const account = await db.accountTransaction.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(account);
}

export async function POST(request: any) {
  const data = await request.json();

  const newTransaction = await db.accountTransaction.create({
    data: {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      payee: data.payee,
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
      accountId: data.accountId,
    },
  });

  return NextResponse.json(newTransaction);
}

export async function DELETE(
  request: any,
  { params }: AccountBudgetParamsProps
) {
  console.log("on delete", params);
  try {
    const transactionDeleted = await db.accountTransaction.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(transactionDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
