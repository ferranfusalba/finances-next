"use client";
import { useCounterStore } from "@/store/counterStore";

export default function ZustandClient() {
  const count = useCounterStore((state) => state.count);
  const { increment } = useCounterStore();

  return <>Level: {count}</>;
}
