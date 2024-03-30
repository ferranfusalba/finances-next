"use client";

import { useSession } from "next-auth/react";

export default function ClientSession() {
  const { data: session } = useSession();

  return (
    <>
      <h3>Session info (client):</h3>
      <p>session.expires: {session?.expires}</p>
      <p>session.user.name: {session?.user?.name}</p>
      <p>session.user.email: {session?.user?.email}</p>
      <p>
        session.user.image:{" "}
        <img src={session?.user?.image as string} alt="Profile picture" />
      </p>
    </>
  );
}
