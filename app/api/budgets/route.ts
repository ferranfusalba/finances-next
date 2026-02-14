import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export async function GET() {
  const budgets = await db.budget.findMany();
  return NextResponse.json(budgets);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  try {
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
