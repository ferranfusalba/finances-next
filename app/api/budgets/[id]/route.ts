import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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

  try {
    await db.budget.update({
      where: {
        id,
      },
      data: data,
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
