"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUserState } from "@/store/userStore";
import { User } from "@/types/User";

export default function ZustandUserClient({ user }: { user: User }) {
  const userStore = useUserState((state) => ({
    id: state.id,
  }));
  const { initUserStore } = useUserState();

  useEffect(() => {
    initUserStore(user);
  }, []);

  return (
    <div className="flex gap-2 invisible md:visible">
      <p>User id on Zustand: {userStore.id}</p>
      {/* <Button variant="default" onClick={() => initUserStore(user)}>
        Set User
      </Button> */}
    </div>
  );
}
