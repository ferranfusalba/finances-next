import { NextResponse } from "next/server";

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

export async function POST(request: any) {
  const data = await request.json();

  const newAccount = await db.account.create({
    data: {
      active: data.active,
      bankName: data.bankName,
      code: data.code,
      createdAt: data.createdAt,
      description: data.description,
      defaultCurrency: data.defaultCurrency,
      id: data.id,
      initialBalance: data.initialBalance,
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
}
