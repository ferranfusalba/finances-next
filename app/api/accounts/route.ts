import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

import { currentUser } from "@/lib/auth";
import { requiredParentAccountType } from "@/lib/utils/account";
import { getTimezoneOffset } from "@/lib/utils/timezone";
import { computeTransactionAmount } from "@/lib/utils/transaction";
import { CreateAccountSchema } from "@/schemas";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await db.account.findMany({
    where: {
      userId: user.id,
    },
  });
  return NextResponse.json(
    accounts.map((a) => ({
      ...a,
      currentBalance: toNumber(a.currentBalance),
    }))
  );
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // The cash leg must hang off an invested parent, and only the cash leg may.
  // Verified server-side: the parent has to exist, belong to the caller, and be
  // of the right type — otherwise a crafted request could attach a cash leg to
  // someone else's account and surface its transactions on their page.
  const requiredParent = requiredParentAccountType(data.type);

  if (requiredParent) {
    if (!data.parentAccountId) {
      return NextResponse.json(
        {
          error: `A ${data.type} account must belong to an ${requiredParent} account.`,
        },
        { status: 400 }
      );
    }

    const parent = await db.account.findUnique({
      where: { id: data.parentAccountId },
      select: { userId: true, type: true },
    });

    if (!parent || parent.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (parent.type !== requiredParent) {
      return NextResponse.json(
        {
          error: `A ${data.type} account must belong to an ${requiredParent} account, not a ${parent.type} one.`,
        },
        { status: 400 }
      );
    }
  } else if (data.parentAccountId) {
    return NextResponse.json(
      { error: `A ${data.type} account cannot belong to another account.` },
      { status: 400 }
    );
  }

  // A cash leg only makes sense under an invested one.
  if (data.cashOpeningBalance != null && data.type !== "INVESTMENT") {
    return NextResponse.json(
      { error: "Only an INVESTMENT account can be given a cash leg." },
      { status: 400 }
    );
  }

  // OPENING preserves its sign — an account may legitimately open in the red.
  const openingAmount = computeTransactionAmount("OPENING", data.openingBalance);

  // The opening carries its timezone like every other row. Without it the ledger
  // renders it in the browser's zone, so an opening set at midnight in Madrid
  // would read 23:00 on the PREVIOUS day to anyone west of it.
  const openingZone = data.openingTimezoneId || null;
  const openingAt =
    data.openingDate instanceof Date
      ? data.openingDate
      : new Date(data.openingDate);

  const openingRow = (accountId: string, amount: number) => ({
    accountId,
    type: "OPENING",
    concept: "Opening balance",
    amount,
    currency: data.defaultCurrency,
    dateTime: data.openingDate,
    timezoneId: openingZone,
    timezoneOffset: openingZone
      ? getTimezoneOffset(openingZone, openingAt)
      : null,
    payee: "",
    category: "",
    notes: "",
    tags: [],
  });

  try {
    // Account and opening are written together. An account that exists without
    // its opening row would report a balance of 0 and offer no way back — the
    // starting balance is not recoverable once the create form is gone.
    //
    // The cash leg, when asked for, is part of the same write. A provider that
    // holds cash for you has two balances from the moment it exists; creating
    // the invested leg first and bolting the cash on afterwards means entering
    // the total as the invested figure and then going back to subtract it.
    const newAccount = await db.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          active: data.active,
          bankName: data.bankName,
          code: data.code,
          description: data.description,
          defaultCurrency: data.defaultCurrency,
          currentBalance: openingAmount,
          number: data.number,
          country: data.country,
          name: data.name,
          type: data.type,
          parentAccountId: data.parentAccountId ?? null,
          userId: user.id,
        },
      });

      await tx.accountTransaction.create({
        data: openingRow(account.id, openingAmount),
      });

      if (data.cashOpeningBalance != null) {
        const cashAmount = computeTransactionAmount(
          "OPENING",
          data.cashOpeningBalance
        );

        const cash = await tx.account.create({
          data: {
            active: true,
            // Bank, currency and country are inherited: the cash your provider
            // holds is at the same provider, in the same currency, by definition.
            bankName: data.bankName,
            code: `${data.code}.CASH`,
            description: null,
            defaultCurrency: data.defaultCurrency,
            currentBalance: cashAmount,
            number: null,
            country: data.country,
            name: "Cash",
            type: "INVESTMENT_CASH",
            parentAccountId: account.id,
            userId: user.id,
          },
        });

        await tx.accountTransaction.create({
          data: openingRow(cash.id, cashAmount),
        });
      }

      return account;
    });

    return NextResponse.json(newAccount);
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
