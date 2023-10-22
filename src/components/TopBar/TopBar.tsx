"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-slate-900 flex items-center px-6 py-3 justify-between text-white">
      <Link href="/">
        <h1>Finances</h1>
      </Link>
      <div className="flex gap-x-2 items-center">
        {session?.user ? (
          <>
            <p>
              {session.user.name} - {session.user.email}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.user.image!}
              alt="Profile picture"
              className="w-10 h-10 rounded-full cursor-pointer"
            />
            <button
              onClick={async () => {
                await signOut({ callbackUrl: "/" });
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/signin">
            <button className="bg-sky-400 px-3 py-2 rounded">Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
