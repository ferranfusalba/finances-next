import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getUserDefaultTaxRate, getUserTransactionCategories } from "@/lib/user";
import Layout02b from "@/components/layouts/Layout02b";
import RecurringPresetsForm from "@/components/settings/RecurringPresetsForm";
import TaxPresetsForm from "@/components/settings/TaxPresetsForm";

function toRate(raw: unknown): number | null {
  if (raw == null) return null;
  const n = Number(String(raw));
  return isNaN(n) ? null : n;
}

export default async function TaxPresetsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [categories, defaultTaxRate] = await Promise.all([
    getUserTransactionCategories(session.user.id),
    getUserDefaultTaxRate(session.user.id),
  ]);

  const serialized = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      defaultTaxRate: toRate(cat.defaultTaxRate),
      subcategories: cat.subcategories
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          defaultTaxRate: toRate(sub.defaultTaxRate),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const recurringCategories = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      recurring: cat.recurring as string | null,
      subcategories: cat.subcategories
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          recurring: sub.recurring as string | null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout02b>
      <div className="w-full h-full p-4 md:p-8 space-y-8">
        <TaxPresetsForm
          categories={serialized}
          defaultTaxRate={defaultTaxRate}
        />
        <RecurringPresetsForm categories={recurringCategories} />
      </div>
    </Layout02b>
  );
}
