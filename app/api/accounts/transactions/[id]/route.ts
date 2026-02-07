import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function DELETE(
  _request: NextRequest,
  { params }: AccountBudgetParamsProps
) {
  try {
    const transaction = await db.accountTransaction.findUnique({
      where: { id: params.id },
      select: { accountId: true, amount: true },
    });

    if (!transaction) {
      return NextResponse.json("Transaction not found", { status: 404 });
    }

    await db.accountTransaction.delete({
      where: { id: params.id },
    });

    const account = await db.account.findUnique({
      where: { id: transaction.accountId },
      select: { initialBalance: true },
    });

    const remaining = await db.accountTransaction.aggregate({
      where: { accountId: transaction.accountId },
      _sum: { amount: true },
    });

    await db.account.update({
      where: { id: transaction.accountId },
      data: {
        currentBalance: (account?.initialBalance ?? 0) + (remaining._sum.amount ?? 0),
      },
    });

    return NextResponse.json({ deleted: params.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
