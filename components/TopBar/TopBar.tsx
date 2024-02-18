import Link from "next/link";
import LogoutButtonClient from "./LogoutButtonClient";
import { currentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TopBar = async () => {
  const user = await currentUser();

  return (
    <nav className="bg-slate-900 flex items-center px-6 py-3 justify-between text-white">
      <Link href="/">
        <div className="flex gap-4">
          <h1>Finances</h1>
        </div>
      </Link>
      <div className="flex gap-x-2 items-center">
        {user ? (
          <>
            <p>
              {user?.name} - {user?.email}
            </p>
            <Avatar>
              <AvatarImage src={user.image!} />
              <AvatarFallback>{user.name![0]}</AvatarFallback>
            </Avatar>
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
