import { db } from "@/lib/db";
import { BudgetParamsProps } from "@/types/Budget";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: BudgetParamsProps) {
  const budget = await db.budget.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: any, { params }: BudgetParamsProps) {
  const data = await request.json();
  await db.budget.update({
    where: {
      id: params.id,
    },
    data: data,
  });

  return NextResponse.json("Updating Budget " + params.id);
}

export async function DELETE(request: any, { params }: BudgetParamsProps) {
  try {
    const budgetDeleted = await db.budget.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(budgetDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
