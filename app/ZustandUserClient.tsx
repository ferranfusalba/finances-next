"use client";

import { useEffect } from "react";
import { useUserState } from "@/store/userStore";
import { User } from "@/types/User";

export default function ZustandUserClient({ user }: { user: User }) {
  const { initUserStore } = useUserState();

  // TODO: Finish this
  const fullUser = {
    ...user,
    accounts: [{ id: "", order: 0 }],
    // budgets: [{}, {}, {}],
  };

  //
  const userStore = useUserState((state) => state);
  //

  useEffect(() => {
    initUserStore(user);
  }, []);

  return (
    <div className="flex gap-2 invisible md:visible">
      <p>User id on Zustand: {userStore.id}</p>
    </div>
  );
}
