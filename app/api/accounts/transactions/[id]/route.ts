import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UpdateAccountTransactionSchema } from "@/schemas";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

async function recomputeBalance(accountId: string) {
  const result = await db.accountTransaction.aggregate({
    where: { accountId },
    _sum: { amount: true },
  });

  await db.account.update({
    where: { id: accountId },
    data: { currentBalance: result._sum.amount ?? 0 },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: AccountBudgetParamsProps
) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateAccountTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const existing = await db.accountTransaction.findUnique({
      where: { id },
      select: { accountId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Verify user owns the account
    const account = await db.account.findUnique({
      where: { id: existing.accountId },
      select: { userId: true },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete existing tax lines, they'll be re-created
    await db.taxLine.deleteMany({
      where: { accountTransactionId: id },
    });

    const { taxLines, ...transactionData } = data;

    const updated = await db.accountTransaction.update({
      where: { id },
      data: {
        ...transactionData,
        ...(taxLines?.length ? {
          taxLines: {
            create: taxLines.map((line) => ({
              rate: line.rate,
              amount: line.amount,
              inclusive: line.inclusive,
              taxAmount: line.taxAmount,
            })),
          },
        } : {}),
      },
    });

    await recomputeBalance(existing.accountId);

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: AccountBudgetParamsProps
) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const transaction = await db.accountTransaction.findUnique({
      where: { id },
      select: { accountId: true, amount: true },
    });

    if (!transaction) {
      return NextResponse.json("Transaction not found", { status: 404 });
    }

    // Verify user owns the account
    const account = await db.account.findUnique({
      where: { id: transaction.accountId },
      select: { userId: true },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.accountTransaction.delete({
      where: { id },
    });

    const remaining = await db.accountTransaction.aggregate({
      where: { accountId: transaction.accountId },
      _sum: { amount: true },
    });

    await db.account.update({
      where: { id: transaction.accountId },
      data: {
        currentBalance: remaining._sum.amount ?? 0,
      },
    });

    return NextResponse.json({ deleted: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
