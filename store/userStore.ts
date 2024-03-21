import { User } from "@/types/User";
import { create } from "zustand";

interface UserState extends User {
  initUserStore: (user: User) => void;
}

export const useUserState = create<UserState>((set) => ({
  id: "",
  name: "",
  email: "",
  emailVerified: null,
  image: "",
  password: "",
  role: "",
  createdAt: null,
  updatedAt: null,
  accounts: [],
  budgets: [],
  initUserStore: (user: User) =>
    set(() => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accounts: user.accounts,
      budgets: user.budgets,
    })),
  clearStore: () => {
    set({}, true);
  },
}));
