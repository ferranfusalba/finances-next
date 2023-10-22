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
      active: data.active,
      createdAt: data.createdAt,
      description: data.description,
      id: data.id,
      initialBalance: data.initialBalance,
      name: data.name,
      type: data.type,
      updatedAt: data.updatedAt,
      userId: data.userId,
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
