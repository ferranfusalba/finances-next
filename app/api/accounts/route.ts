import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await db.financialAccount.findMany();
  return NextResponse.json(accounts);
}

export async function POST(request: any) {
  const data = await request.json();

  const newAccount = await db.financialAccount.create({
    data: {
      active: data.active,
      code: data.code,
      createdAt: data.createdAt,
      description: data.description,
      id: data.id,
      initialBalance: data.initialBalance,
      name: data.name,
      type: data.type,
      updatedAt: data.updatedAt,
      userId: data.userId,
    },
  });

  return NextResponse.json(newAccount);
}

export function PUT() {
  return NextResponse.json({
    message: "PUT works!",
  });
}

export function DELETE() {
  return NextResponse.json({
    message: "DELETE works!",
  });
}