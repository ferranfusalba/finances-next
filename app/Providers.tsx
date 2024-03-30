"use client";

import axios from "axios";
import { SessionProvider } from "next-auth/react";

import { useUserState } from "@/store/userStore";

export default function Providers({
  session,
  children,
}: {
  session: any;
  children: React.ReactNode;
}) {
  const { initUserStore } = useUserState();

  axios.get("/api/accounts").then(function (response) {
    const fullUser = {
      ...session?.user,
      accounts: response.data,
      // budgets: userBudgets,
    };

    initUserStore(fullUser);
  });

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
