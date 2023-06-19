import TaskCard from "@/components/TaskCard";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import Link from "next/link";

const getData = async (id) => {
  const user = await getUserFromCookie(cookies());
  const account = await db.project.findFirst({
    where: { id, ownerId: user?.id },
    include: {
      tasks: true,
    },
  });

  return account;
};

export default async function AccountPage({ params }) {
  const account = await getData(params.id);

  return (
    <div className="h-full overflow-y-auto w-1/1">
      <div>
        <Link href="/accounts">Back</Link>
      </div>
      <TaskCard tasks={account.tasks} title={account.name} />
    </div>
  );
}
