import { auth } from "@/auth";

import ClientSession from "@/components/home/ClientSession";

import getUser from "@/lib/user";

export default async function Home() {
  const serverSession = await auth();

  const user = await getUser(serverSession?.user?.email as string);

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
      <h3>User info</h3>
      <p>user.id: {user?.id}</p>
      <p>user.name: {user?.name}</p>
      <p>user.email: {user?.email}</p>
      <p>user.createdAt: {user?.createdAt?.toString()}</p>
      <p>user.updatedAt: {user?.updatedAt?.toString()}</p>
      <p>user.userCountry: {user?.userCountry}</p>
      <p>user.userCurrency: {user?.userCurrency}</p>
      <p>user.userTimezone: {user?.userTimezone}</p>
      <p>user.userLocale: {user?.userLocale}</p>
    </>
  );
}
