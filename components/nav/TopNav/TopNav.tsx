import Link from "next/link";

import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/auth";
import { getDistinctTransactionYears } from "@/lib/data";
import { UserDropdownMenu } from "./components/UserDropdownMenu/UserDropdownMenu";
import YearSelector from "./components/YearSelector/YearSelector";

const TopNav = async () => {
  const user = await currentUser();
  const years = user?.id ? await getDistinctTransactionYears(user.id) : [];

  return (
    <nav
      aria-label="Main"
      className="flex items-center px-6 py-3 justify-between bg-white dark:bg-black"
    >
      <Link href="/">
        <div className="flex gap-4 items-center">
          <h1>Finances</h1>
          {user && <YearSelector years={years} />}
        </div>
      </Link>
      <div className="flex gap-x-2 items-center">
        {user ? (
          <>
            <p className="hidden md:block">
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
