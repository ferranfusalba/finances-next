import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function GET(_request: NextRequest, { params }: AccountBudgetParamsProps) {
  const budget = await db.budget.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: NextRequest, { params }: AccountBudgetParamsProps) {
  const data = await request.json();
  await db.budget.update({
    where: {
      id: params.id,
    },
    data: data,
  });

  return NextResponse.json("Updating Budget " + params.id);
}

export async function DELETE(
  _request: NextRequest,
  { params }: AccountBudgetParamsProps
) {
  try {
    await db.budgetTransaction.deleteMany({
      where: {
        budgetId: params.id,
      },
    });

    const budgetDeleted = await db.budget.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(budgetDeleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
