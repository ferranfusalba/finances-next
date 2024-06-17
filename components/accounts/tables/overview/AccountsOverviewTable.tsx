"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";

import "@/components/accounts/tables/transactions/AccountTransactionTable.css";

import countries from "@/statics/countries.json";

import { Account } from "@/types/Account";

const columnHelper = createColumnHelper<Account>();

export default function AccountsOverviewTable({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  const getEmojiFlag = (alpha2Code: string) => {
    const country = countries.find((c) => c["alpha-2"] === alpha2Code);
    return country ? country["emoji-flag"] : "🏳️"; // Return a default flag if not found
  };

  const columns = [
    columnHelper.accessor("order", {
      header: () => <span>Order</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("bankName", {
      header: () => <span>Bank</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("name", {
      header: () => <span>Name</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("code", {
      header: () => <span>Code</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("active", {
      header: () => <span>Active</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("type", {
      header: () => <span>Type</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("description", {
      header: () => <span>Description</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("defaultCurrency", {
      header: () => <span>Currency</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("currentBalance", {
      header: () => <span>Balance</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("number", {
      header: () => <span>Number</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("country", {
      header: () => <span>Country</span>,
      cell: (info) => {
        return (
          <>
            {info.row.original.country}{" "}
            {getEmojiFlag(info.row.original.country)}
          </>
        );
      },
      footer: (info) => info.column.id,
    }),
  ];

  const data = accounts;

  type ColumnSort = {
    id: string;
    desc: boolean;
  };

  type SortingState = ColumnSort[];

  const [sorting, setSorting] = useState<SortingState>([
    { id: "order", desc: false },
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
