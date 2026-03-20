import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CreateSalarySchema } from "@/schemas/salary";
import { toNumber } from "@/lib/utils";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const salaries = await db.salary.findMany({
    where: { userId: user.id },
    orderBy: { month: "desc" },
    include: {
      lines: { orderBy: { order: "asc" } },
      payments: {
        include: {
          transaction: {
            select: {
              id: true,
              amount: true,
              currency: true,
              payee: true,
              concept: true,
              dateTime: true,
              accountId: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(
    salaries.map((s) => ({
      ...s,
      grossPay: toNumber(s.grossPay),
      lines: s.lines.map((l) => ({
        ...l,
        amount: toNumber(l.amount),
      })),
      payments: s.payments.map((p) => ({
        ...p,
        transaction: {
          ...p.transaction,
          amount: toNumber(p.transaction.amount),
        },
      })),
    })),
  );
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateSalarySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Verify user owns all linked transactions
  if (data.payments.length > 0) {
    const transactionIds = data.payments.map((p) => p.transactionId);
    const transactions = await db.accountTransaction.findMany({
      where: {
        id: { in: transactionIds },
        Account: { userId: user.id },
      },
      select: { id: true },
    });

    if (transactions.length !== transactionIds.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const salary = await db.salary.create({
      data: {
        userId: user.id,
        month: data.month,
        employer: data.employer,
        grossPay: data.grossPay,
        currency: data.currency,
        notes: data.notes,
        lines: {
          create: data.lines.map((l, i) => ({
            concept: l.concept,
            group: l.group,
            amount: l.amount,
            order: l.order ?? i,
          })),
        },
        payments: {
          create: data.payments.map((p) => ({
            transactionId: p.transactionId,
            concept: p.concept,
          })),
        },
      },
      include: {
        lines: true,
        payments: { include: { transaction: true } },
      },
    });

    return NextResponse.json(salary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
