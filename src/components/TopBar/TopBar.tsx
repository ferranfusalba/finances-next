import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Navbar } from "@/components/_navbar/navbar";

const TopBar = async () => {
  const session = await auth();

  return (
    <nav className="bg-slate-900 flex items-center px-6 py-3 justify-between text-white">
      <Link href="/">
        <h1>Finances</h1>
      </Link>
      <Navbar></Navbar>
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
            <form
              action={async () => {
                "use server";

                await signOut();
              }}
            >
              <button type="submit">Sign Out</button>
            </form>
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
