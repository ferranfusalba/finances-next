"use client";
import Link from "next/link";
import { signIn, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-slate-900 flex items-center py-3 justify-between px-24 text-white">
      <Link href="/">
        <h1>Finances</h1>
      </Link>
      <div className="flex gap-x-2 items-center">
        {session?.user ? (
          <>
            <Link href="/accounts">Accounts</Link>
            <p>
              {session.user.name} {session.user.email}
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
          <button
            onClick={() => signIn()}
            className="bg-sky-400 px-3 py-2 rounded"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
