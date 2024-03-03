import { db } from "@/lib/db";
import { auth } from "@/auth";
import getUserId from "@/utils/getUserId";
import SectionNavMenuList from "./list/SectionNavMenuList";
import SectionNavMenuAdd from "./SectionNavMenuAdd";

async function loadUserAccounts(userId: string) {
  return await db.financialAccount.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function SectionNavMenu() {
  const session = await auth();
  const userEmail = session?.user?.email as string;
  const userId = await getUserId(userEmail);
  const userAccounts = await loadUserAccounts(userId?.id as string);

  return (
    <>
      <nav className="flex bg-sky-900 fixed top-16 w-full z-10">
        <ul>
          <SectionNavMenuAdd />
        </ul>
        <SectionNavMenuList accountList={userAccounts} />
      </nav>
    </>
  );
}
