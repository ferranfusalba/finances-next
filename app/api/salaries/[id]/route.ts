import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UpdateSalarySchema } from "@/schemas/salary";
import { toNumber } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const salary = await db.salary.findUnique({
    where: { id },
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

  if (!salary || salary.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...salary,
    grossPay: toNumber(salary.grossPay),
    lines: salary.lines.map((l) => ({
      ...l,
      amount: toNumber(l.amount),
    })),
    payments: salary.payments.map((p) => ({
      ...p,
      transaction: {
        ...p.transaction,
        amount: toNumber(p.transaction.amount),
      },
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.salary.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = UpdateSalarySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Verify user owns all linked transactions
  if (data.payments && data.payments.length > 0) {
    const transactionIds = data.payments.map((p) => p.transactionId!);
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
    const salary = await db.$transaction(async (tx) => {
      // Delete existing lines and payments if we're replacing them
      if (data.lines !== undefined) {
        await tx.salaryLine.deleteMany({ where: { salaryId: id } });
      }
      if (data.payments !== undefined) {
        await tx.salaryPayment.deleteMany({ where: { salaryId: id } });
      }

      return tx.salary.update({
        where: { id },
        data: {
          ...(data.month !== undefined && { month: data.month }),
          ...(data.employer !== undefined && { employer: data.employer }),
          ...(data.grossPay !== undefined && { grossPay: data.grossPay }),
          ...(data.currency !== undefined && { currency: data.currency }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.lines !== undefined && {
            lines: {
              create: data.lines.map((l, i) => ({
                concept: l.concept,
                group: l.group,
                amount: l.amount,
                order: l.order ?? i,
              })),
            },
          }),
          ...(data.payments !== undefined && {
            payments: {
              create: data.payments.map((p) => ({
                transactionId: p.transactionId!,
                concept: p.concept ?? "",
              })),
            },
          }),
        },
        include: {
          lines: true,
          payments: { include: { transaction: true } },
        },
      });
    });

    return NextResponse.json(salary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.salary.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.salary.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
