"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { getCountryFlag } from "@/lib/utils/country";

import { Timezone } from "@/types/Timezone";

const columnHelper = createColumnHelper<Timezone>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("offset", {
    header: "Offset",
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor("region", {
    header: "Region",
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("countryCodes", {
    header: "Countries",
    cell: (info) =>
      info.getValue()?.map((code) => (
        <Link
          key={code}
          title={code}
          href={`/statics/countries?highlightId=${code}&fromLabel=${encodeURIComponent("Timezones")}`}
        >
          {getCountryFlag(code)}
        </Link>
      )),
  }),
];

export default function TimezonesTable({
  timezones,
}: {
  timezones: Timezone[];
}) {
  const searchParams = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const hid = searchParams.get("highlightId");
    if (!hid) return;
    const match = timezones.find((tz) => tz.id === hid);
    if (match) setHighlightedId(match.id);
  }, [searchParams, timezones]);

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedId]);

  const table = useReactTable({
    data: timezones,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="m-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b text-left select-none">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isHighlighted = row.original.id === highlightedId;
            return (
              <tr
                key={row.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={cn(
                  "border-b",
                  isHighlighted && "bg-yellow-900/40",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
