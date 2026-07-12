import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  checkOpeningDateInvariant,
  recomputeAccountBalance,
} from "@/lib/accounts";
import { toNumber } from "@/lib/utils";
import {
  computeTransactionAmount,
  isTransactionTypeAllowed,
} from "@/lib/utils/transaction";
import { UpdateAccountTransactionSchema } from "@/schemas";

import { AccountParamsProps } from "@/types/AccountParams";

export async function PUT(
  request: NextRequest,
  { params }: AccountParamsProps
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
      select: { accountId: true, type: true, amount: true, transferId: true, typeTransferDestination: true, typeTransferOrigin: true, dateTime: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Verify user owns the account
    const account = await db.account.findUnique({
      where: { id: existing.accountId },
      select: { userId: true, type: true },
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const effectiveType = data.type ?? existing.type;

    if (!isTransactionTypeAllowed(account.type, effectiveType)) {
      return NextResponse.json(
        { error: `${effectiveType} is not valid on a ${account.type} account` },
        { status: 400 }
      );
    }

    // Both directions of the opening-date rule: moving the opening forward past
    // an existing transaction, and moving a transaction back before the opening.
    const effectiveDateTime = data.dateTime ?? existing.dateTime;
    const openingError = await checkOpeningDateInvariant({
      accountId: existing.accountId,
      type: effectiveType,
      dateTime: effectiveDateTime,
      excludeTransactionId: id,
    });

    if (openingError) {
      return NextResponse.json({ error: openingError }, { status: 400 });
    }

    // Editing a transfer re-dates its mirror row on the other account, which has
    // an opening of its own. The mirror is a TRANSFER, never an OPENING, so it
    // can never be the row we compare against — no self-exclusion needed.
    if (existing.type === "TRANSFER") {
      const mirrorAccountId =
        existing.typeTransferDestination === existing.accountId
          ? existing.typeTransferOrigin
          : existing.typeTransferDestination;

      if (mirrorAccountId) {
        const mirrorError = await checkOpeningDateInvariant({
          accountId: mirrorAccountId,
          type: "TRANSFER",
          dateTime: effectiveDateTime,
        });

        if (mirrorError) {
          return NextResponse.json(
            { error: `Destination account: ${mirrorError}` },
            { status: 400 }
          );
        }
      }
    }

    // Re-derive the sign server-side from the effective type. Also covers a type
    // change that arrives without a new amount (e.g. INCOME -> EXPENSE), which
    // would otherwise leave the old sign in place.
    const signedAmount = computeTransactionAmount(
      effectiveType,
      data.amount ?? toNumber(existing.amount)
    );

    // Delete existing tax lines, they'll be re-created
    await db.taxLine.deleteMany({
      where: { accountTransactionId: id },
    });

    // accountId is intentionally excluded from the update: a transaction must
    // not be reparented to a different account via this endpoint (which would
    // allow moving it into another user's account). It stays on its existing,
    // ownership-verified account.
    const { taxLines, location, accountId, ...transactionData } = data;
    void accountId;

    const updated = await db.accountTransaction.update({
      where: { id },
      data: {
        ...transactionData,
        amount: signedAmount,
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
              amount: -signedAmount,
              currency: transactionData.currency,
              dateTime: transactionData.dateTime,
              timezoneId: transactionData.timezoneId,
              timezoneOffset: transactionData.timezoneOffset,
              notes: transactionData.notes,
              category: transactionData.category,
              subcategory: transactionData.subcategory,
              tags: transactionData.tags,
              typeTransferOrigin: transactionData.typeTransferOrigin,
              typeTransferDestination: transactionData.typeTransferDestination,
            },
          });
          await recomputeAccountBalance(mirrorAccountId);
        }
      }
    }

    await recomputeAccountBalance(existing.accountId);

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: AccountParamsProps
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

    // The opening is not deletable. Removing it would silently restate every
    // running balance on the account and leave no way to recover the starting
    // figure. Edit its amount instead.
    if (transaction.type === "OPENING") {
      return NextResponse.json(
        {
          error:
            "The opening balance cannot be deleted. Edit its amount or date instead.",
        },
        { status: 400 }
      );
    }

    await db.accountTransaction.delete({
      where: { id },
    });

    await recomputeAccountBalance(transaction.accountId);

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
          await recomputeAccountBalance(mirrorAccountId);
        }
      }
    }

    return NextResponse.json({ deleted: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(message, { status: 500 });
  }
}
