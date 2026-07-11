import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { recomputeAccountBalance } from "@/lib/accounts";
import { CreateAccountTransactionSchema } from "@/schemas";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateAccountTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify user owns the account
  const account = await db.account.findUnique({
    where: { id: data.accountId },
    select: { userId: true },
  });

  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // For transfers, verify user also owns the destination account
  if (data.type === "TRANSFER" && data.typeTransferDestination) {
    const destAccount = await db.account.findUnique({
      where: { id: data.typeTransferDestination },
      select: { userId: true },
    });

    if (!destAccount || destAccount.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const transferId = data.type === "TRANSFER" && data.typeTransferDestination
      ? randomUUID()
      : undefined;

    const transactionData = {
      payee: data.payee,
      recurring: data.recurring,
      concept: data.concept,
      type: data.type,
      typeTransferOrigin: data.typeTransferOrigin,
      typeTransferDestination: data.typeTransferDestination,
      transferId,
      currency: data.currency,
      amount: data.amount,
      foreignCurrency: data.foreignCurrency,
      foreignCurrencyAmount: data.foreignCurrencyAmount,
      foreignCurrencyExchangeRate: data.foreignCurrencyExchangeRate,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags,
      dateTime: data.dateTime,
      timezoneId: data.timezoneId,
      timezoneOffset: data.timezoneOffset,
      location: data.location ?? Prisma.DbNull,
      notes: data.notes,
      accountId: data.accountId,
      ...(data.taxLines?.length ? {
        taxLines: {
          create: data.taxLines.map(line => ({
            rate: line.rate,
            amount: line.amount,
            inclusive: line.inclusive,
            taxAmount: line.taxAmount,
          })),
        },
      } : {}),
    };

    const newTransaction = await db.accountTransaction.create({
      data: transactionData,
    });

    await recomputeAccountBalance(data.accountId);

    // For transfers, create the mirror transaction on the destination account
    if (data.type === "TRANSFER" && data.typeTransferDestination) {
      const { taxLines: _taxLines, ...transferData } = transactionData;
      await db.accountTransaction.create({
        data: {
          ...transferData,
          amount: -data.amount,
          accountId: data.typeTransferDestination,
          ...(data.taxLines?.length ? {
            taxLines: {
              create: data.taxLines.map(line => ({
                rate: line.rate,
                amount: line.amount,
                inclusive: line.inclusive,
                taxAmount: line.taxAmount,
              })),
            },
          } : {}),
        },
      });

      await recomputeAccountBalance(data.typeTransferDestination);
    }

    return NextResponse.json(newTransaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
