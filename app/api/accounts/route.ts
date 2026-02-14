import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

import { currentUser } from "@/lib/auth";
import { CreateAccountSchema } from "@/schemas";

export async function GET() {
  const user = await currentUser();

  const accounts = await db.account.findMany({
    where: {
      userId: user?.id,
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
  const body = await request.json();
  const parsed = CreateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const newAccount = await db.account.create({
      data: {
        active: data.active,
        bankName: data.bankName,
        code: data.code,
        description: data.description,
        defaultCurrency: data.defaultCurrency,
        currentBalance: data.currentBalance,
        number: data.number,
        country: data.country,
        name: data.name,
        type: data.type,
        userId: data.userId,
      },
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
