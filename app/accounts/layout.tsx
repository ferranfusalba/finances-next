import SectionNavMenu from "@/components/nav/SectionNav/SectionNavMenu";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import getUserId from "@/utils/getUserId";

export const metadata: Metadata = {
  title: "Accounts | Finances Next",
};

async function loadUserAccounts(userId: string) {
  return await db.financialAccount.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userAccounts = await loadUserAccounts(userId?.id as string);

  return (
    <>
      <SectionNavMenu type="accounts" list={userAccounts} />
      {/* TODO: Solve this TS error */}
      <main className="h-full-main-mobile md:h-full-main pt-11">
        {children}
      </main>
    </>
  );
}
