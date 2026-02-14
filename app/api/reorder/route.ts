import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { type, items } = await request.json();

  if (type !== "accounts" && type !== "budgets") {
    return NextResponse.json(
      { error: "Invalid type. Must be 'accounts' or 'budgets'" },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Items must be a non-empty array" },
      { status: 400 }
    );
  }

  try {
    const updates = items.map((item: { id: string; order: number }) =>
      type === "accounts"
        ? db.account.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        : db.budget.update({
            where: { id: item.id },
            data: { order: item.order },
          })
    );

    await db.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
