import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// export async function GET() {
//   const accounts = await db.financialAccount.findMany();
//   return NextResponse.json(accounts);
// }

export async function POST(request: any) {
  const data = await request.json();

  const newTransaction = await db.financialAccountTransaction.create({
    data: {
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      payee: data.payee,
      concept: data.concept,
      type: data.type,
      currency: data.currency,
      amount: data.amount,
      balance: data.balance,
      category: data.category,
      dateTime: data.dateTime,
      timezone: data.timezone,
      location: data.location,
      notes: data.notes,
      accountId: data.accountId,
    },
  });

  return NextResponse.json(newTransaction);
}

// export function PUT() {
//   return NextResponse.json({
//     message: "PUT works!",
//   });
// }

// export function DELETE() {
//   return NextResponse.json({
//     message: "DELETE works!",
//   });
// }
