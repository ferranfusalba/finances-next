import { User } from "@/types/User";
import { create } from "zustand";

interface UserState {
  id: number;
  name: string;
  password: string;
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  initUserStore: (user: User) => void;
}

export const useUserState = create<UserState>((set) => ({
  id: 0,
  name: "",
  password: "",
  email: "",
  createdAt: null,
  updatedAt: null,
  initUserStore: (user: User) =>
    set(() => ({
      id: user.id,
      name: user.name,
      password: user.password,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
  clearStore: () => {
    set({}, true);
  },
}));
