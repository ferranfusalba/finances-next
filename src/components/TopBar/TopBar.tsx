import Link from "next/link";
import LogoutButtonClient from "./LogoutButtonClient";
import { currentUser } from "@/lib/auth";

const TopBar = async () => {
  const user = await currentUser();

  return (
    <nav className="bg-slate-900 flex items-center px-6 py-3 justify-between text-white">
      <Link href="/">
        <h1>Finances</h1>
      </Link>
      <div className="flex gap-x-2 items-center">
        {user ? (
          <>
            <p>
              {user?.name} - {user?.email}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.image!}
              alt="Profile picture"
              className="w-10 h-10 rounded-full cursor-pointer"
            />
            <LogoutButtonClient />
          </>
        ) : (
          <Link href="/signin">
            <button className="bg-sky-400 px-3 py-2 rounded">Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopBar;
