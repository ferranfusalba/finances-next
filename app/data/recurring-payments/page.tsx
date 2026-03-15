import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getAccounts } from "@/lib/accounts";
import { getRecurringPayments } from "@/lib/data";
import { parseYearParam } from "@/lib/utils/yearFilter";
import RecurringPaymentsTable from "@/components/data/RecurringPaymentsTable";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function DataRecurringPaymentsPage({
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
    getRecurringPayments(userId, year),
    getAccounts(userId),
  ]);

  const userLocale = session?.user?.userLocale ?? "en-US";

  const accountMap: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, `${a.bankName} · ${a.name}`]),
  );

  return (
    <Layout02a1>
      <div className="py-2 pb-20">
        <RecurringPaymentsTable
          transactions={transactions}
          accountMap={accountMap}
          userLocale={userLocale}
        />
      </div>
    </Layout02a1>
  );
}
