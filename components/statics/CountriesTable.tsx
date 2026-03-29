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
import { Launch } from "@carbon/icons-react";

import { cn } from "@/lib/utils";
import { Country } from "@/types/Country";

const columnHelper = createColumnHelper<Country>();

const columns = [
  columnHelper.accessor("flag", {
    header: "Flag",
    cell: (info) => <span className="text-xl">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("alpha2Code", {
    header: "Alpha-2",
    size: 80,
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.accessor("alpha3Code", {
    header: "Alpha-3",
    size: 80,
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "currencies",
    header: "Currencies",
    cell: (info) => {
      const currencies = info.row.original.currencies;
      if (!currencies?.length) return null;
      return (
        <span className="font-mono text-muted-foreground">
          {currencies.map((c, i) => (
            <span key={c.code} className="inline-flex items-center">
              {i > 0 && ", "}
              {c.code}
              <Link
                href={`/statics/currencies?highlightId=${c.code}&fromLabel=${encodeURIComponent("Countries")}`}
              >
                <Launch className="h-3 w-3 ml-0.5 shrink-0 text-muted-foreground hover:text-foreground" />
              </Link>
            </span>
          ))}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "timezones",
    header: "Timezones",
    cell: (info) => {
      const timezones = info.row.original.timezones;
      if (!timezones?.length) return null;
      return (
        <span className="text-muted-foreground text-xs">
          {timezones.map((tz, i) => (
            <span key={tz.id} className="inline-flex items-center">
              {i > 0 && ", "}
              {tz.id}
              <Link
                href={`/statics/timezones?highlightId=${tz.id}&fromLabel=${encodeURIComponent("Countries")}`}
              >
                <Launch className="h-3 w-3 ml-0.5 shrink-0 text-muted-foreground hover:text-foreground" />
              </Link>
            </span>
          ))}
        </span>
      );
    },
  }),
];

export default function CountriesTable({
  countries,
}: {
  countries: Country[];
}) {
  const searchParams = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const hid = searchParams.get("highlightId");
    if (!hid) return;
    const match = countries.find((c) => c.alpha2Code === hid);
    if (match) setHighlightedId(match.alpha2Code);
  }, [searchParams, countries]);

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedId]);

  const table = useReactTable({
    data: countries,
    columns,
    defaultColumn: { size: undefined },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="m-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b text-left select-none">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-2"
                  style={
                    header.column.columnDef.size !== undefined
                      ? { width: header.getSize() }
                      : undefined
                  }
                >
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
            const isHighlighted = row.original.alpha2Code === highlightedId;
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
