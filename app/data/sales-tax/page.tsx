import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getAccounts } from "@/lib/accounts";
import { getSalesTaxTransactions } from "@/lib/data";
import SalesTaxTable from "@/components/data/SalesTaxTable";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function DataSalesTaxPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const [transactions, accounts] = await Promise.all([
    getSalesTaxTransactions(userId),
    getAccounts(userId),
  ]);

  const userLocale = session?.user?.userLocale ?? "en-US";

  const accountMap: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, `${a.bankName} · ${a.name}`]),
  );

  return (
    <Layout02a1>
      <div className="py-2 pb-20">
        <SalesTaxTable
          transactions={transactions}
          accountMap={accountMap}
          userLocale={userLocale}
        />
      </div>
    </Layout02a1>
  );
}
