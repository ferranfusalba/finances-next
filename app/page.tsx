import { auth } from "@/auth";

import ZustandUserClient from "@/app/ZustandUserClient";

import ClientSession from "@/components/home/ClientSession";

import { db } from "@/lib/db";

import { User } from "@/types/User";

import getUserId from "@/utils/getUserId";

async function loadUserAccounts(userId: string) {
  return await db.account.findMany({
    where: {
      userId: userId,
    },
  });
}

async function loadUserBudgets(userId: string) {
  return await db.budget.findMany({
    where: {
      userId: userId,
    },
  });
}

export default async function Home() {
  const serverSession = await auth();

  const user = await getUserId(serverSession?.user?.email as string);
  const userAccounts = await loadUserAccounts(
    serverSession?.user?.id as string
  );
  const userBudgets = await loadUserBudgets(serverSession?.user?.id as string);

  if (serverSession) {
    return (
      <>
        <h1>Finances Home</h1>
        <h3>Session info (server):</h3>
        <p>serverSession.user.name: {serverSession?.user?.name}</p>
        <p>serverSession.user.email: {serverSession?.user?.email}</p>
        <p>
          serverSession.user.image:{" "}
          <img
            src={serverSession?.user?.image as string}
            alt="Profile picture"
          />
        </p>
        <ClientSession />
        <ZustandUserClient
          user={user as User}
          userAccounts={userAccounts}
          userBudgets={userBudgets}
        ></ZustandUserClient>
        <h3>User info</h3>
        <p>user.id: {user?.id}</p>
        <p>user.name: {user?.name}</p>
        <p>user.email: {user?.email}</p>
        {/* <p>user.password: {user?.password}</p> */}
        <p>user.createdAt: {user?.createdAt?.toString()}</p>
        <p>user.updatedAt: {user?.updatedAt?.toString()}</p>
      </>
    );
  }

  return <h1>(Finances Home)</h1>;
}
