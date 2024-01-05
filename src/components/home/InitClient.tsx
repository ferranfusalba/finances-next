"use client";

import { useCounterStore } from "@/store/counterStore";
import { useEffect } from "react";

export default function InitClient() {
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
    <>
      <p>Init Client</p>
      <p>Count: {storeCount.count}</p>
      <br />
      <button onClick={() => increment(10)}>Increment by 10</button>
      <br />
      <button onClick={() => clearStore()}>Clear</button>
      <br />
      <button onClick={() => multiply(2)}>Multiply by 2</button>
    </>
  );
}
