import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function GET(request: any, { params }: AccountBudgetParamsProps) {
  const account = await db.account.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: any, { params }: AccountBudgetParamsProps) {
  const data = await request.json();
  await db.account.update({
    where: {
      id: params.id,
    },
    data: data,
  });

  return NextResponse.json("Updating Account " + params.id);
}

export async function DELETE(
  request: any,
  { params }: AccountBudgetParamsProps
) {
  try {
    await db.accountTransaction.deleteMany({
      where: {
        accountId: params.id,
      },
    });

    const accountDeleted = await db.account.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(accountDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
