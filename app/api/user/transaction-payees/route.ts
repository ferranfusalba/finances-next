import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const newTransactionPayee = await db.userTransactionPayee.create({
    data: {
      id: data.id,
      userId: data.userId,
      name: data.name,
    },
  });

  return NextResponse.json(newTransactionPayee);
}
