import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, items } = await request.json();

  if (type !== "accounts") {
    return NextResponse.json(
      { error: "Invalid type. Must be 'accounts'" },
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
    // Scope updates to only resources owned by the current user
    const updates = items.map((item: { id: string; order: number }) =>
      db.account.update({
        where: { id: item.id, userId: user.id },
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
