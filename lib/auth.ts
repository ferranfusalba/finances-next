import { auth } from "@/auth";

export const currentUser = async () => {
  const serverSession = await auth();

  return serverSession?.user;
};

export const currentRole = async () => {
  const serverSession = await auth();

  return serverSession?.user?.role;
};
