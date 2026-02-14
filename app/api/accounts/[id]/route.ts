import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";
import { UpdateAccountSchema } from "@/schemas";

export async function GET(_request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const account = await db.account.findUnique({
    where: {
      id,
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...account,
    currentBalance: toNumber(account.currentBalance),
  });
}

export async function PUT(request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    await db.account.update({
      where: {
        id,
      },
      data: parsed.data,
    });

    return NextResponse.json("Updating Account " + id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this code already exists" },
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
    await db.accountTransaction.deleteMany({
      where: {
        accountId: id,
      },
    });

    const accountDeleted = await db.account.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(accountDeleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
