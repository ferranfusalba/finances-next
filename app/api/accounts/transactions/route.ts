import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CreateAccountTransactionSchema } from "@/schemas";

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

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateAccountTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
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
    const transactionData = {
      payee: data.payee,
      concept: data.concept,
      type: data.type,
      typeTransferOrigin: data.typeTransferOrigin,
      typeTransferDestination: data.typeTransferDestination,
      currency: data.currency,
      amount: data.amount,
      foreignCurrency: data.foreignCurrency,
      foreignCurrencyAmount: data.foreignCurrencyAmount,
      foreignCurrencyExchangeRate: data.foreignCurrencyExchangeRate,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags,
      dateTime: data.dateTime,
      timezone: data.timezone,
      location: data.location,
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

    await recomputeBalance(data.accountId);

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

      await recomputeBalance(data.typeTransferDestination);
    }

    return NextResponse.json(newTransaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
