import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

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
      select: { accountId: true, type: true, transferId: true, typeTransferDestination: true, typeTransferOrigin: true, dateTime: true },
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

    const { taxLines, location, ...transactionData } = data;

    const updated = await db.accountTransaction.update({
      where: { id },
      data: {
        ...transactionData,
        ...(location !== undefined ? { location: location ?? Prisma.DbNull } : {}),
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

    // Sync mirror transaction for transfers
    if (existing.type === "TRANSFER") {
      let activeTransferId = existing.transferId;

      // Backfill transferId for existing transfers that don't have one
      if (!activeTransferId) {
        activeTransferId = randomUUID();
        await db.accountTransaction.update({
          where: { id },
          data: { transferId: activeTransferId },
        });

        const mirrorAccountId = existing.typeTransferDestination === existing.accountId
          ? existing.typeTransferOrigin
          : existing.typeTransferDestination;

        if (mirrorAccountId) {
          const mirror = await db.accountTransaction.findFirst({
            where: {
              accountId: mirrorAccountId,
              type: "TRANSFER",
              dateTime: existing.dateTime,
              transferId: null,
            },
          });
          if (mirror) {
            await db.accountTransaction.update({
              where: { id: mirror.id },
              data: { transferId: activeTransferId },
            });
          }
        }
      }

      // Update the mirror transaction with synced fields
      const mirrorAccountId = existing.typeTransferDestination === existing.accountId
        ? existing.typeTransferOrigin
        : existing.typeTransferDestination;

      if (mirrorAccountId && activeTransferId) {
        const mirror = await db.accountTransaction.findFirst({
          where: {
            accountId: mirrorAccountId,
            type: "TRANSFER",
            transferId: activeTransferId,
          },
        });
        if (mirror) {
          await db.accountTransaction.update({
            where: { id: mirror.id },
            data: {
              payee: transactionData.payee,
              concept: transactionData.concept,
              amount: transactionData.amount !== undefined ? -transactionData.amount : undefined,
              currency: transactionData.currency,
              dateTime: transactionData.dateTime,
              timezone: transactionData.timezone,
              notes: transactionData.notes,
              category: transactionData.category,
              subcategory: transactionData.subcategory,
              tags: transactionData.tags,
              typeTransferOrigin: transactionData.typeTransferOrigin,
              typeTransferDestination: transactionData.typeTransferDestination,
            },
          });
          await recomputeBalance(mirrorAccountId);
        }
      }
    }

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
      select: { accountId: true, amount: true, type: true, transferId: true, typeTransferOrigin: true, typeTransferDestination: true },
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

    await recomputeBalance(transaction.accountId);

    // Delete mirror transaction for transfers
    if (transaction.type === "TRANSFER" && transaction.transferId) {
      const mirrorAccountId = transaction.typeTransferDestination === transaction.accountId
        ? transaction.typeTransferOrigin
        : transaction.typeTransferDestination;

      if (mirrorAccountId) {
        const mirror = await db.accountTransaction.findFirst({
          where: {
            accountId: mirrorAccountId,
            type: "TRANSFER",
            transferId: transaction.transferId,
          },
        });
        if (mirror) {
          await db.accountTransaction.delete({
            where: { id: mirror.id },
          });
          await recomputeBalance(mirrorAccountId);
        }
      }
    }

    return NextResponse.json({ deleted: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
