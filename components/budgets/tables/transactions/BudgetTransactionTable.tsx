"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";


import { currency } from "@/lib/utils";

import { BudgetTransaction } from "@/types/Transaction";

const columnHelper = createColumnHelper<BudgetTransaction>();

export default function BudgetTransactionTable({
  budgetTransactions,
  userLocale,
}: {
  budgetTransactions: Array<BudgetTransaction>;
  userLocale: string;
}) {
  const columns = [
    columnHelper.accessor((row) => row.createdAt, {
      id: "createdAt",
      cell: (info) => {
        return <i>{info.getValue().toLocaleString("ca")}</i>;
      },
      header: () => <span>createdAt</span>,
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
        const defaultCurrency = info.row.original?.currency;

        return <>{currency(userLocale, defaultCurrency).format(number)}</>;
      },
      header: "Amount",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("balance", {
      cell: (info) => {
        const number = info.getValue();
        const defaultCurrency = info.row.original?.currency;

        return <>{currency(userLocale, defaultCurrency).format(number)}</>;
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
              {currency(userLocale, foreignCurrency as string).format(
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
    columnHelper.accessor("location", {
      header: "Location",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("notes", {
      header: "Notes",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("id", {
      cell: (info) => {
        const transactionId = info.row.original?.id;

        return <>{transactionId}</>;
      },
      header: "Transaction ID",
      footer: (info) => info.column.id,
    }),
  ];
  const data = budgetTransactions;

  type ColumnSort = {
    id: string;
    desc: boolean;
  };

  type SortingState = ColumnSort[];

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
            <tr key={headerGroup.id} className="bg-slate-400">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-start px-2 border-r border-r-slate-900 font-bold"
                >
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
            <tr
              key={row.id}
              className="bg-slate-900 border-b border-b-slate-400"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id} className="bg-slate-400 text-slate-600">
              {footerGroup.headers.map((header) => (
                <th key={header.id} className="px-2 font-bold">
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
