import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRandomCategoryColor } from "@/lib/utils/categoryColors";

const VALID_CATEGORY_TYPES = ["INCOME", "EXPENSE", "TRANSFER"];

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await db.userTransactionCategory.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      defaultTaxRate: true,
      recurring: true,
      subcategories: {
        select: { id: true, name: true, defaultTaxRate: true, recurring: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!data.type || !VALID_CATEGORY_TYPES.includes(data.type)) {
    return NextResponse.json(
      { error: "type must be one of: INCOME, EXPENSE, TRANSFER" },
      { status: 400 },
    );
  }

  const transactionCategory = await db.userTransactionCategory.upsert({
    where: {
      userId_name_type: { userId: user.id, name: data.name, type: data.type },
    },
    update: {},
    create: {
      userId: user.id,
      name: data.name,
      type: data.type,
      color: getRandomCategoryColor(),
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

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const rate =
    data.defaultTaxRate === null || data.defaultTaxRate === ""
      ? null
      : data.defaultTaxRate;

  // Update a subcategory
  if (data.subcategoryId) {
    const sub = await db.userTransactionSubcategory.findFirst({
      where: {
        id: data.subcategoryId,
        category: { userId: user.id },
      },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 },
      );
    }

    const subUpdateData: Record<string, unknown> = { defaultTaxRate: rate };
    if ("recurring" in data) {
      subUpdateData.recurring = data.recurring;

      // Update existing transactions matching this category + subcategory
      const category = await db.userTransactionCategory.findFirst({
        where: { id: sub.categoryId },
        select: { name: true },
      });
      if (category) {
        await db.accountTransaction.updateMany({
          where: {
            Account: { userId: user.id },
            category: category.name,
            subcategory: sub.name,
          },
          data: { recurring: data.recurring },
        });
      }
    }

    const updated = await db.userTransactionSubcategory.update({
      where: { id: data.subcategoryId },
      data: subUpdateData,
    });

    return NextResponse.json(updated);
  }

  // Update a category
  if (!data.categoryId) {
    return NextResponse.json(
      { error: "categoryId or subcategoryId is required" },
      { status: 400 },
    );
  }

  const category = await db.userTransactionCategory.findFirst({
    where: { id: data.categoryId, userId: user.id },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 },
    );
  }

  const updateData: Record<string, unknown> = { defaultTaxRate: rate };
  if ("recurring" in data) {
    updateData.recurring = data.recurring;

    // Update existing transactions matching this category
    await db.accountTransaction.updateMany({
      where: {
        Account: { userId: user.id },
        category: category.name,
      },
      data: { recurring: data.recurring },
    });
  }
  if ("color" in data) {
    updateData.color = data.color;
  }
  if ("name" in data && data.name) {
    updateData.name = data.name;
  }
  if ("type" in data && VALID_CATEGORY_TYPES.includes(data.type) && data.type !== category.type) {
    updateData.type = data.type;

    // Update existing transactions from old type to new type
    await db.accountTransaction.updateMany({
      where: {
        Account: { userId: user.id },
        category: category.name,
        type: category.type,
      },
      data: { type: data.type },
    });
  }

  const updated = await db.userTransactionCategory.update({
    where: { id: data.categoryId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
