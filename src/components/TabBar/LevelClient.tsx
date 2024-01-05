"use client";

import { useCounterStore } from "@/store/counterStore";
import { useEffect } from "react";

export default function LevelClient() {
  const storeCount = useCounterStore((state) => ({
    count: state.count,
    // posts: state.posts,
  }));
  // getPosts
  const { increment, clearStore, multiply } = useCounterStore();

  // useEffect(() => {
  //   getPosts();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <div className="flex gap-2 invisible md:visible">
      <p>Level: {storeCount.count}</p>
      <button className="bg-sky-400 px-3 rounded" onClick={() => increment(10)}>
        +10
      </button>
      <button className="bg-green-400 px-3 rounded" onClick={() => multiply(2)}>
        x2
      </button>
      <button className="bg-rose-400 px-3 rounded" onClick={() => clearStore()}>
        Clear Store
      </button>
    </div>
  );
}
