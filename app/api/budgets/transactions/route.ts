import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { currentUser } from "@/lib/auth";
import { CreateBudgetTransactionSchema } from "@/schemas";

async function recomputeBalance(budgetId: string) {
  const budget = await db.budget.findUnique({
    where: { id: budgetId },
    select: { initialBalance: true },
  });

  const result = await db.budgetTransaction.aggregate({
    where: { budgetId },
    _sum: { amount: true },
  });

  const newBalance = toNumber(budget?.initialBalance) + toNumber(result._sum.amount);

  await db.budget.update({
    where: { id: budgetId },
    data: { currentBalance: newBalance },
  });

  return newBalance;
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateBudgetTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify user owns the budget
  const budget = await db.budget.findUnique({
    where: { id: data.budgetId },
    select: { userId: true },
  });

  if (!budget || budget.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const newTransaction = await db.budgetTransaction.create({
      data: {
        concept: data.concept,
        type: data.type,
        currency: data.currency,
        amount: data.amount,
        balance: 0,
        foreignCurrency: data.foreignCurrency,
        foreignCurrencyAmount: data.foreignCurrencyAmount,
        foreignCurrencyExchangeRate: data.foreignCurrencyExchangeRate,
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags,
        dateTime: data.dateTime,
        timezoneId: data.timezoneId,
        timezoneOffset: data.timezoneOffset,
        location: data.location ?? Prisma.DbNull,
        notes: data.notes,
        budgetId: data.budgetId,
      },
    });

    // Recompute budget balance and update transaction's running balance
    const newBalance = await recomputeBalance(data.budgetId);

    await db.budgetTransaction.update({
      where: { id: newTransaction.id },
      data: { balance: newBalance },
    });

    return NextResponse.json(newTransaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
