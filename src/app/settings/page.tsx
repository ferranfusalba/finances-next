"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { signOut } from "next-auth/react";
import { Navbar } from "./_components/navbar";

const SettingsPage = () => {
  const user = useCurrentUser();

  const onClick = () => {
    signOut();
  };

  return (
    <div className="bg-white text-black p-10 rounded-xl">
      <Navbar></Navbar>
      <button type="submit" onClick={onClick}>
        Sign Out
      </button>
    </div>
  );
};

export default SettingsPage;
