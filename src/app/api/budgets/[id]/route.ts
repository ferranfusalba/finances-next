import { prisma } from "@/libs/prisma";
import { BudgetParamsProps } from "@/types/Budget";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: BudgetParamsProps) {
  const budget = await prisma.budget.findUnique({
    where: {
      id: Number(params.id),
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: any, { params }: BudgetParamsProps) {
  const data = await request.json();
  await prisma.budget.update({
    where: {
      id: Number(params.id),
    },
    data: data,
  });

  return NextResponse.json("Updating Budget " + params.id);
}

export async function DELETE(request: any, { params }: BudgetParamsProps) {
  try {
    const budgetDeleted = await prisma.budget.delete({
      where: {
        id: Number(params.id),
      },
    });

    return NextResponse.json(budgetDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
