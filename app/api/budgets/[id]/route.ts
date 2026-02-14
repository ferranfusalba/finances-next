import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";
import { UpdateBudgetSchema } from "@/schemas";

export async function GET(_request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const budget = await db.budget.findUnique({
    where: {
      id,
    },
  });

  if (!budget) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...budget,
    initialBalance: toNumber(budget.initialBalance),
    currentBalance: toNumber(budget.currentBalance),
  });
}

export async function PUT(request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await db.budget.update({
      where: {
        id,
      },
      data: parsed.data,
    });

    return NextResponse.json("Updating Budget " + id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A budget with this code already exists" },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
