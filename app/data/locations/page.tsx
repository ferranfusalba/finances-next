import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getTransactionLocations } from "@/lib/data";
import TransactionLocationsMapLoader from "@/components/data/TransactionLocationsMapLoader";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function DataLocationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const locations = await getTransactionLocations(userId);
  const userLocale = session?.user?.userLocale ?? "en-US";

  return (
    <Layout02a1>
      <div className="py-2">
        <TransactionLocationsMapLoader
          locations={locations}
          userLocale={userLocale}
        />
      </div>
    </Layout02a1>
  );
}
