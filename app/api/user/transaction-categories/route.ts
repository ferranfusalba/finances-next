import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const transactionCategory = await db.userTransactionCategory.upsert({
    where: {
      userId_name: { userId: data.userId, name: data.name },
    },
    update: {},
    create: {
      id: data.id,
      userId: data.userId,
      name: data.name,
    },
  });

  return NextResponse.json(transactionCategory);
}
