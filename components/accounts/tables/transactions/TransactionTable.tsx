"use client";
import { useReducer, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import "./index.css";
import { AccountTransaction } from "@/types/Transaction";
import { currency } from "@/lib/utils";

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
  columnHelper.accessor("payee", {
    header: () => <span>Payee</span>,
    footer: (info) => info.column.id,
  }),
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
  columnHelper.accessor("currency", {
    header: "Currency",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("amount", {
    cell: (info) => {
      const number = info.getValue();

      return <>{currency("ca-AD", "EUR").format(number)}</>;
    },
    header: "Amount",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("balance", {
    cell: (info) => {
      const number = info.getValue();

      return <>{currency("ca-AD", "EUR").format(number)}</>;
    },
    header: "Balance",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("foreignCurrency", {
    header: "Foreign Currency",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("foreignCurrencyAmount", {
    cell: (info) => {
      const number = info.getValue();
      const foreignCurrency = info.row.original?.foreignCurrency;

      if (foreignCurrency) {
        return (
          <>
            {currency("ca-AD", foreignCurrency as string).format(
              number as number
            )}
          </>
        );
      }

      return <></>;
    },
    header: "Foreign Currency Amount",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("foreignCurrencyExchangeRate", {
    header: "Exchange Rate",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("category", {
    header: "Category",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("subcategory", {
    header: "Subcategory",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("tags", {
    header: "Tags",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor((row) => row.dateTime, {
    id: "dateTime",
    cell: (info) => {
      return <i>{info.getValue().toLocaleString("ca")}</i>;
    },
    header: () => <span>Date & Time</span>,
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("timezone", {
    header: "Timezone",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("location", {
    header: "Location",
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

  type ColumnSort = {
    id: string;
    desc: boolean;
  };

  type SortingState = ColumnSort[];

  // Sorting by dateTime on client to ensure it is presented correctly - TODO: enhance it maybe?
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: false },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch">
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
    </div>
  );
}
