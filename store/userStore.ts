import { User } from "@/types/User";
import { create } from "zustand";

interface UserState {
  id: string;
  // name: string | null;
  // email: string | null;
  // emailVerified: Date | null;
  // image: string | null;
  // password: string | null;
  // role: string | null;
  // createdAt: Date | null;
  // updatedAt: Date | null;
  initUserStore: (user: User) => void;
}

export const useUserState = create<UserState>((set) => ({
  id: "",
  // name: "",
  // email: "",
  // emailVerified: null,
  // image: "",
  // password: "",
  // role: "",
  // createdAt: null,
  // updatedAt: null,
  initUserStore: (user: User) =>
    set(() => ({
      id: user.id,
      // name: user.name,
      // email: user.email,
      // role: user.role,
      // createdAt: user.createdAt,
      // updatedAt: user.updatedAt,
    })),
  clearStore: () => {
    set({}, true);
  },
}));
