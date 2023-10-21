"use client";
import Link from "next/link";

export default function DataMenuItem({ data }: { data: any }) {
  return (
    <li
      key={data.id}
      className="border-2 border-white flex justify-center items-center min-w-10rem mx-2.5"
    >
      <Link href={"/data/" + data.id}>{data.name}</Link>{" "}
    </li>
  );
}
