import { auth, signOut } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Finances Next",
};

const SettingsPage = async () => {
  const session = await auth();

  return (
    <>
      <h1>Settings</h1>
      {JSON.stringify(session)}
      <form
        action={async () => {
          "use server";

          await signOut();
        }}
      >
        <button type="submit">Sign Out</button>
      </form>
    </>
  );
};

export default SettingsPage;
