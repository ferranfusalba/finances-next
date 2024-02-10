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
      concept: data.concept,
      type: data.type,
      import: data.import,
      currency: data.currency,
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
