import { create } from "zustand";

interface Post {
  id: number;
  title: string;
  body: string;
}

interface CounterState {
  count: number;
  posts: Post[];
  increment: (value: number) => void;
  getPosts: () => Promise<void>;
  clearStore: () => void;
  multiply: (value: number) => void;
}

export const useCounterStore = create<CounterState>((set, get) => ({
  count: 20,
  posts: [],
  increment: (value: number) =>
    set((state) => ({
      count: state.count + value,
    })),
  getPosts: async () => {
    const posts = (await (
      await fetch("https://jsonplaceholder.typicode.com/posts")
    ).json()) as Array<Post>;
    set((state) => ({
      ...state,
      posts,
    }));
    console.log("posts", posts);
  },
  clearStore: () => {
    set({}, true);
  },
  multiply: (value: number) => {
    const { count } = get();
    set({ count: count * value });
  },
}));
