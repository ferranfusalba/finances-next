"use client";

import Layout02b from "@/components/layouts/Layout02b";
import { UserInfo } from "@/components/user-info";
import { useCurrentUser } from "@/hooks/use-current-user";

const ClientPage = () => {
  const user = useCurrentUser();

  return (
    <Layout02b>
      <UserInfo user={user} label="📱 Client Component" />
    </Layout02b>
  );
};

export default ClientPage;
