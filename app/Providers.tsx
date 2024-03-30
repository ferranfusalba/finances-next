"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

import { useUserState } from "@/store/userStore";

import { Account } from "@/types/Account";

export default function Providers({
  session,
  children,
}: {
  session: any;
  children: React.ReactNode;
}) {
  const { initUserStore } = useUserState();
  const userStore = useUserState((state) => state);

  var userAccounts: Array<Account> = [];
  const fetchAccounts = async () => {
    const response = await fetch("/api/accounts"); // TODO: Fix terminal error
    const data = await response.json();
    return data;
  };

  fetchAccounts().then((res) => {
    userAccounts = res;

    const fullUser = {
      ...session?.user,
      accounts: userAccounts,
      // budgets: userBudgets,
    };

    initUserStore(fullUser);
  });

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
