import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();

  const accounts = await db.account.findMany({
    where: {
      userId: user?.id,
    },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  try {
    const newAccount = await db.account.create({
      data: {
        active: data.active,
        bankName: data.bankName,
        code: data.code,
        createdAt: data.createdAt,
        description: data.description,
        defaultCurrency: data.defaultCurrency,
        id: data.id,
        currentBalance: data.currentBalance,
        number: data.number,
        country: data.country,
        name: data.name,
        type: data.type,
        updatedAt: data.updatedAt,
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
