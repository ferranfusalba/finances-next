"use client";

import { useEffect } from "react";

import { useUserState } from "@/store/userStore";

import { User } from "@/types/User";
import { Account } from "@/types/Account";
import { Budget } from "@/types/Budget";

export default function ZustandUserClient({
  user,
  userAccounts,
  userBudgets,
}: {
  user: User;
  userAccounts: Array<Account>;
  userBudgets: Array<Budget>;
}) {
  const { initUserStore } = useUserState();

  const fullUser = {
    ...user,
    accounts: userAccounts,
    budgets: userBudgets,
  };

  const userStore = useUserState((state) => state);

  useEffect(() => {
    initUserStore(fullUser);
  }, []);

  return (
    <div className="flex gap-2 invisible md:visible">
      <p>User id on Zustand: {userStore.id}</p>
    </div>
  );
}
