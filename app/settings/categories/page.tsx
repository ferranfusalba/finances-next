import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getUserTransactionCategories } from "@/lib/user";
import Layout02b from "@/components/layouts/Layout02b";
import CategorySettingsForm from "@/components/settings/CategorySettingsForm";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const categories = await getUserTransactionCategories(session.user.id);

  const serialized = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      subcategories: cat.subcategories
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout02b>
      <div className="w-full h-full p-4 md:p-8 space-y-8">
        <CategorySettingsForm categories={serialized} />
      </div>
    </Layout02b>
  );
}
