import { auth } from "@/auth";

import ClientSession from "@/components/home/ClientSession";

import getUser from "@/lib/user";

export default async function Home() {
  const serverSession = await auth();

  const user = await getUser(serverSession?.user?.email as string);

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
        <h3>User info</h3>
        <p>user.id: {user?.id}</p>
        <p>user.name: {user?.name}</p>
        <p>user.email: {user?.email}</p>
        {/* <p>user.password: {user?.password}</p> */}
        <p>user.createdAt: {user?.createdAt?.toString()}</p>
        <p>user.updatedAt: {user?.updatedAt?.toString()}</p>
        <p>user.defaultCountry: {user?.defaultCountry}</p>
        <p>user.defaultCurrency: {user?.defaultCurrency}</p>
        <p>user.defaultTimezone: {user?.defaultTimezone}</p>
        <p>user.defaultLocale: {user?.defaultLocale}</p>
      </>
    );
  }

  return <h1>(Finances Home)</h1>;
}
