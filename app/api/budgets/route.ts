import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const budgets = await db.budget.findMany();
  return NextResponse.json(budgets);
}

export async function POST(request: any) {
  const data = await request.json();

  const newBudget = await db.budget.create({
    data: {
      active: data.active,
      code: data.code,
      createdAt: data.createdAt,
      description: data.description,
      defaultCurrency: data.defaultCurrency,
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
