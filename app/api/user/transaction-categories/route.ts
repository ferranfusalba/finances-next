import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: any) {
  const data = await request.json();

  const newTransactionCategory = await db.userTransactionCategory.create({
    data: {
      id: data.id,
      userId: data.userId,
      name: data.name,
    },
  });

  return NextResponse.json(newTransactionCategory);
}
