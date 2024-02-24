"use client";
import { Data } from "@/types/Data";
import Link from "next/link";

export default function DataMenuItem({ data }: { data: Data }) {
  return (
    <li
      key={data.id}
      className="border-2 border-white flex justify-center items-center mx-2.5 px-4 h-11"
    >
      <Link className="w-max min-w-10rem text-center" href={"/data/" + data.id}>
        {data.name}
      </Link>{" "}
    </li>
  );
}
