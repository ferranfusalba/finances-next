import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const budgets = await prisma.budget.findMany();
  return NextResponse.json(budgets);
}

export async function POST(request: any) {
  const data = await request.json();

  const newBudget = await prisma.budget.create({
    data: {
      id: data.id,
      name: data.name,
      active: data.active,
      type: data.type,
      description: data.description,
      initialBalance: data.initialBalance,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
  });

  return NextResponse.json(newBudget);
}

export function PUT() {
  return NextResponse.json({
    message: "PUT works!",
  });
}

export function DELETE() {
  return NextResponse.json({
    message: "DELETE works!",
  });
}
