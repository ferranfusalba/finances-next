import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getAccounts } from "@/lib/accounts";
import { accountLabel } from "@/lib/utils/account";
import { getSalesTaxTransactions } from "@/lib/data";
import { parseYearParam } from "@/lib/utils/yearFilter";
import SalesTaxTable from "@/components/data/SalesTaxTable";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function DataSalesTaxPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; [key: string]: string | string[] | undefined }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = parseYearParam(yearParam);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const [transactions, accounts] = await Promise.all([
    getSalesTaxTransactions(userId, year),
    getAccounts(userId),
  ]);

  const userLocale = session?.user?.userLocale ?? "en-US";

  const accountMap: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, accountLabel(a, accounts)]),
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
