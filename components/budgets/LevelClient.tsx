"use client";

import { useCounterStore } from "@/store/counterStore";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
      <Button variant="default" onClick={() => increment(10)}>
        +10
      </Button>
      <Button variant="secondary" onClick={() => multiply(2)}>
        x2
      </Button>
      <Button variant="destructive" onClick={() => clearStore()}>
        Clear Store
      </Button>
    </div>
  );
}
