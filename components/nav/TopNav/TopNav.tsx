import Link from "next/link";

import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/auth";
import { UserDropdownMenu } from "./components/UserDropdownMenu/UserDropdownMenu";

const TopNav = async () => {
  const user = await currentUser();

  return (
    <nav className="h-16 flex items-center px-6 py-3 justify-between bg-white dark:bg-black">
      <Link href="/">
        <div className="flex gap-4">
          <h1>Finances</h1>
        </div>
      </Link>
      <div className="flex gap-x-2 items-center">
        {user ? (
          <>
            <p className="invisible md:visible">
              {user?.name} - {user?.email}
            </p>
            <UserDropdownMenu user={user} />
          </>
        ) : (
          <Link href="/signin">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
