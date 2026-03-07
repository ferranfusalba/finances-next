import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const transactionCategory = await db.userTransactionCategory.upsert({
    where: {
      userId_name: { userId: user.id, name: data.name },
    },
    update: {},
    create: {
      userId: user.id,
      name: data.name,
    },
  });

  if (data.subcategory) {
    await db.userTransactionSubcategory.upsert({
      where: {
        categoryId_name: {
          categoryId: transactionCategory.id,
          name: data.subcategory,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: data.subcategory,
        categoryId: transactionCategory.id,
      },
    });
  }

  return NextResponse.json(transactionCategory);
}
