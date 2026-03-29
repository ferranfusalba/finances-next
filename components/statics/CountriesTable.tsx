"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
    cell: (info) => (
      <span className="font-mono text-muted-foreground">
        {info.row.original.currencies?.map((c) => c.code).join(", ")}
      </span>
    ),
  }),
  columnHelper.display({
    id: "timezones",
    header: "Timezones",
    cell: (info) => (
      <span className="text-muted-foreground text-xs">
        {info.row.original.timezones?.map((tz) => tz.id).join(", ")}
      </span>
    ),
  }),
];

export default function CountriesTable({
  countries,
}: {
  countries: Country[];
}) {
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
