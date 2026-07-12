import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getAccounts } from "@/lib/accounts";
import { accountLabel } from "@/lib/utils/account";
import {
  getSalaries,
  getSalaryTransactions,
  getDistinctSalaryEmployers,
  getDistinctSalaryLineGroups,
  getDistinctSalaryLineConcepts,
} from "@/lib/data";
import { parseYearParam } from "@/lib/utils/yearFilter";
import SalariesView from "@/components/data/salaries/SalariesView";
import Layout02a1 from "@/components/layouts/Layout02a1";

export default async function DataSalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; [key: string]: string | string[] | undefined }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = parseYearParam(yearParam);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const [salaries, transactions, accounts, employers, groups, concepts] =
    await Promise.all([
      getSalaries(userId, year),
      getSalaryTransactions(userId, year),
      getAccounts(userId),
      getDistinctSalaryEmployers(userId),
      getDistinctSalaryLineGroups(userId),
      getDistinctSalaryLineConcepts(userId),
    ]);

  const userLocale = session?.user?.userLocale ?? "en-US";
  const defaultCurrency = session?.user?.userCurrency ?? "EUR";

  const accountMap: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, accountLabel(a, accounts)]),
  );

  return (
    <Layout02a1>
      <div className="py-2 pb-20">
        <SalariesView
          salaries={salaries}
          transactions={transactions}
          existingEmployers={employers}
          existingGroups={groups}
          existingConcepts={concepts}
          accountMap={accountMap}
          userLocale={userLocale}
          defaultCurrency={defaultCurrency}
        />
      </div>
    </Layout02a1>
  );
}
