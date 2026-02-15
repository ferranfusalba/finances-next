import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { currentUser } from "@/lib/auth";
import { CreateBudgetSchema } from "@/schemas";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const budgets = await db.budget.findMany({
    where: { userId: user.id },
  });
  return NextResponse.json(
    budgets.map((b) => ({
      ...b,
      initialBalance: toNumber(b.initialBalance),
      currentBalance: toNumber(b.currentBalance),
    }))
  );
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const newBudget = await db.budget.create({
      data: {
        active: data.active,
        code: data.code,
        description: data.description,
        defaultCurrency: data.defaultCurrency,
        initialBalance: data.initialBalance,
        name: data.name,
        type: data.type,
        userId: user.id,
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
