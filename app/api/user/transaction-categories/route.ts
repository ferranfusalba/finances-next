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

  // Count transactions per category and subcategory
  const transactions = await db.accountTransaction.groupBy({
    by: ["category", "subcategory"],
    where: { Account: { userId: user.id } },
    _count: { _all: true },
  });

  const categoriesWithCounts = categories.map((cat) => {
    const categoryTotal = transactions
      .filter((t) => t.category === cat.name)
      .reduce((sum, t) => sum + t._count._all, 0);

    return {
      ...cat,
      transactionCount: categoryTotal,
      subcategories: cat.subcategories.map((sub) => {
        const subCount = transactions.find(
          (t) => t.category === cat.name && t.subcategory === sub.name,
        );
        return { ...sub, transactionCount: subCount?._count._all ?? 0 };
      }),
    };
  });

  return NextResponse.json(categoriesWithCounts);
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
    // Update existing transactions from old type to new type
    await db.accountTransaction.updateMany({
      where: {
        Account: { userId: user.id },
        category: category.name,
        type: category.type,
      },
      data: { type: data.type },
    });

    const duplicate = await db.userTransactionCategory.findFirst({
      where: { userId: user.id, name: category.name, type: data.type },
      include: { subcategories: true },
    });

    if (duplicate) {
      // Merge: move orphan subcategories to the target category
      const existingSubNames = new Set(duplicate.subcategories.map((s) => s.name));
      const sourceSubcategories = await db.userTransactionSubcategory.findMany({
        where: { categoryId: category.id },
      });
      for (const sub of sourceSubcategories) {
        if (existingSubNames.has(sub.name)) {
          await db.userTransactionSubcategory.delete({ where: { id: sub.id } });
        } else {
          await db.userTransactionSubcategory.update({
            where: { id: sub.id },
            data: { categoryId: duplicate.id },
          });
        }
      }

      // Delete the source category
      await db.userTransactionCategory.delete({ where: { id: category.id } });

      return NextResponse.json(duplicate);
    }

    updateData.type = data.type;
  }

  const updated = await db.userTransactionCategory.update({
    where: { id: data.categoryId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // Delete a subcategory
  if (data.subcategoryId) {
    const sub = await db.userTransactionSubcategory.findFirst({
      where: { id: data.subcategoryId, category: { userId: user.id } },
      include: { category: { select: { name: true } } },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 },
      );
    }

    // Clear subcategory field on affected transactions
    await db.accountTransaction.updateMany({
      where: {
        Account: { userId: user.id },
        category: sub.category.name,
        subcategory: sub.name,
      },
      data: { subcategory: null },
    });

    await db.userTransactionSubcategory.delete({
      where: { id: data.subcategoryId },
    });

    return NextResponse.json({ deleted: true });
  }

  // Delete a category
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

  // Clear category and subcategory fields on affected transactions
  await db.accountTransaction.updateMany({
    where: {
      Account: { userId: user.id },
      category: category.name,
    },
    data: { category: "", subcategory: null },
  });

  // Delete subcategories first, then the category
  await db.userTransactionSubcategory.deleteMany({
    where: { categoryId: data.categoryId },
  });

  await db.userTransactionCategory.delete({
    where: { id: data.categoryId },
  });

  return NextResponse.json({ deleted: true });
}
