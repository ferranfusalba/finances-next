import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const accounts = await prisma.account.findMany();
  console.log(accounts);
  return NextResponse.json(accounts);
}

export async function POST(request: any) {
  const data = await request.json();
  console.log(data); // Server console

  const newAccount = await prisma.account.create({
    data: {
      id: data.id,
      name: data.name,
      active: data.active,
      type: data.type,
      description: data.description,
      initialBalance: data.initialBalance,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
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
