"use client";

import { logout } from "@/actions/logout";

const LogoutButtonClient = () => {
  const onClick = () => {
    logout();
  };

  return (
    <button type="button" onClick={onClick} className="cursor-pointer">
      Log out
    </button>
  );
};

export default LogoutButtonClient;
