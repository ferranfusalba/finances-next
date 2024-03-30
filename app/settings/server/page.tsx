import Layout02b from "@/components/layouts/Layout02b";
import { UserInfo } from "@/components/user-info";

import { currentUser } from "@/lib/auth";

const ServerPage = async () => {
  const user = await currentUser();

  return (
    <Layout02b>
      <UserInfo user={user} label="💻 Server Component" />
    </Layout02b>
  );
};

export default ServerPage;
