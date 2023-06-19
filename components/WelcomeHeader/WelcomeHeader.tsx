import { getUserFromCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { delay } from "@/lib/async";

const getData = async () => {
  await delay(5000);
  const user = await getUserFromCookie(cookies());
  return user;
};

const WelcomeHeader = async () => {
  const user = await getData();

  return (
    <Card className="w-full py-4 relative">
      <div className="mb-4">
        <h1 className="text-3xl text-gray-700 font-bold mb-4">
          Hello, {user?.firstName}!
        </h1>
      </div>
    </Card>
  );
};

export default WelcomeHeader;
