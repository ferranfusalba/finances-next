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
import { getCurrencySymbol, getCurrencyColors } from "@/lib/utils/currency";
import CurrencyTag from "@/components/chips/CurrencyTag";
import BorderChip from "@/components/chips/BorderChip";

import { Currency } from "@/types/Currency";

const columnHelper = createColumnHelper<Currency>();

const columns = [
  columnHelper.accessor("code", {
    header: "Code",
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "symbol",
    header: "Symbol",
    cell: (info) => getCurrencySymbol(info.row.original.code),
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => (
      <span className="text-muted-foreground">
        {info.getValue() ?? "currency"}
      </span>
    ),
  }),
  columnHelper.display({
    id: "colors",
    header: "Colors",
    cell: (info) => {
      const colors = getCurrencyColors(info.row.original.code);
      if (!colors) return null;
      return (
        <div className="flex gap-1">
          <CurrencyTag code={info.row.original.code} />
          <BorderChip data={info.row.original.code} borderColor={colors[0]} />
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "countries",
    header: "Countries",
    cell: (info) =>
      info.row.original.countries?.map((code) => (
        <Link
          key={code}
          title={code}
          href={`/statics/countries?highlightId=${code}&fromLabel=${encodeURIComponent("Currencies")}`}
        >
          {getCountryFlag(code)}
        </Link>
      )),
  }),
];

export default function CurrenciesTable({
  currencies,
}: {
  currencies: Currency[];
}) {
  const searchParams = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const hid = searchParams.get("highlightId");
    if (!hid) return;
    const match = currencies.find((c) => c.code === hid);
    if (match) setHighlightedId(match.code);
  }, [searchParams, currencies]);

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedId]);

  const table = useReactTable({
    data: currencies,
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
            const isHighlighted = row.original.code === highlightedId;
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
