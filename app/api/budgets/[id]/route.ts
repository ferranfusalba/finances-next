import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function GET(_request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const budget = await db.budget.findUnique({
    where: {
      id,
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const data = await request.json();
  await db.budget.update({
    where: {
      id,
    },
    data: data,
  });

  return NextResponse.json("Updating Budget " + id);
}

export async function DELETE(
  _request: NextRequest,
  { params }: AccountBudgetParamsProps
) {
  const { id } = await params;
  try {
    await db.budgetTransaction.deleteMany({
      where: {
        budgetId: id,
      },
    });

    const budgetDeleted = await db.budget.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(budgetDeleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
