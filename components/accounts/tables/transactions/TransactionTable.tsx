"use client";
import { useReducer } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import "./index.css";
import { useCounterStore } from "@/store/counterStore";
import { AccountTransaction } from "@/types/Transaction";

const columnHelper = createColumnHelper<AccountTransaction>();

const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor((row) => row.createdAt, {
    id: "createdAt",
    cell: (info) => {
      return <i>{info.getValue().toLocaleString("ca")}</i>;
    },
    header: () => <span>Created at</span>,
    footer: (info) => info.column.id,
  }),
  // columnHelper.accessor("updatedAt", {
  //   header: () => "Updated At",
  //   cell: (info) => {
  //     return <i>{info.getValue().toLocaleString("ca")}</i>;
  //   },
  //   footer: (info) => info.column.id,
  // }),
  columnHelper.accessor("concept", {
    header: () => <span>Concept</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("type", {
    cell: (info) => {
      return info.getValue();
    },
    header: "Type",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("import", {
    cell: (info) => {
      const number = info.getValue();

      const intlNumber = new Intl.NumberFormat("de-DE", {
        // style: "currency",
        // currency: "EUR",
      }).format(number);

      return <>{intlNumber}</>;
    },
    header: "Import",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("currency", {
    header: "Currency",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("notes", {
    header: "Notes",
    footer: (info) => info.column.id,
  }),
];

export default function TransactionTable({
  accountTransactions,
}: {
  accountTransactions: Array<AccountTransaction>;
}) {
  const data = accountTransactions;
  const rerender = useReducer(() => ({}), {})[1];

  const count = useCounterStore((state) => state.count);
  const { increment } = useCounterStore();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2">
      Level: {count}
      <hr />
      <br />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="h-4" />
      <button onClick={() => rerender()} className="border p-2">
        Rerender
      </button>
    </div>
  );
}
