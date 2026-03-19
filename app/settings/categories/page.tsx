import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getUserTransactionCategories } from "@/lib/user";
import Layout02b from "@/components/layouts/Layout02b";
import CategorySettingsForm from "@/components/settings/CategorySettingsForm";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [categories, transactions] = await Promise.all([
    getUserTransactionCategories(session.user.id),
    db.accountTransaction.groupBy({
      by: ["category", "subcategory"],
      where: { Account: { userId: session.user.id } },
      _count: { _all: true },
    }),
  ]);

  const serialized = categories
    .map((cat) => {
      const categoryTotal = transactions
        .filter((t) => t.category === cat.name)
        .reduce((sum, t) => sum + t._count._all, 0);

      return {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        transactionCount: categoryTotal,
        subcategories: cat.subcategories
          .map((sub) => {
            const subCount = transactions.find(
              (t) => t.category === cat.name && t.subcategory === sub.name,
            );
            return {
              id: sub.id,
              name: sub.name,
              transactionCount: subCount?._count._all ?? 0,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout02b>
      <div className="w-full h-full p-4 md:p-8 space-y-8">
        <CategorySettingsForm categories={serialized} />
      </div>
    </Layout02b>
  );
}
