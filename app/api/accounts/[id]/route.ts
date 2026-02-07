import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function GET(_request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const account = await db.account.findUnique({
    where: {
      id,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: NextRequest, { params }: AccountBudgetParamsProps) {
  const { id } = await params;
  const data = await request.json();
  await db.account.update({
    where: {
      id,
    },
    data: data,
  });

  return NextResponse.json("Updating Account " + id);
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
