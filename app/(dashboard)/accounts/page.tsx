import AccountsMenu from "@/components/Accounts/AccountsMenu";
import { delay } from "@/lib/async";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const getData = async () => {
  await delay(2000);
  const user = await getUserFromCookie(cookies());

  const accounts = await db.project.findMany({
    where: {
      ownerId: user?.id,
    },
    include: {
      tasks: true,
    },
  });

  return { accounts };
};

export default async function Accounts() {
    const { accounts } = await getData();

    return <div className="layout-submenu layout-accounts">
        <h1>Accounts</h1>
        <AccountsMenu accounts={accounts} />
    </div>
}