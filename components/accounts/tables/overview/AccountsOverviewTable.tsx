"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";

import BackgroundChip from "@/components/chips/BackgroundChip";
import "@/components/accounts/tables/transactions/AccountTransactionTable.css";

import countries from "@/statics/countries.json";
import currencies from "@/statics/currencies.json";

import { Account } from "@/types/Account";

const columnHelper = createColumnHelper<Account>();

export default function AccountsOverviewTable({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  // TODO: Refactor these three functions by having a key (country, currency) + object (remaining data) structure ?
  const getEmojiFlag = (alpha2Code: string) => {
    const country = countries.find((c) => c["alpha-2"] === alpha2Code);
    return country ? country["emoji-flag"] : "🏳️"; // Return a default flag if not found
  };

  const getColor0 = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.color0 : "default-color"; // Return a default color if not found
  };

  const getColor1 = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.color1 : "default-color"; // Return a default color if not found
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
      cell: (info) => {
        return (
          <span className="font-mono p-1 bg-slate-100 rounded-md text-stone-900">
            {info.row.original.code}
          </span>
        );
      },
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
      cell: (info) => {
        return (
          <BackgroundChip
            data={info.row.original.defaultCurrency as string}
            backgroundColor={
              getColor0(info.row.original.defaultCurrency as string) as string
            }
            textColor={
              getColor1(info.row.original.defaultCurrency as string) as string
            }
          />
        );
      },
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("currentBalance", {
      header: () => <span>Balance</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("number", {
      header: () => <span>Number</span>,
      cell: (info) => {
        return <span className="font-mono">{info.row.original.number}</span>;
      },
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

  // TODO: Resolve the pb-24 by correct layouts
  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch pb-24">
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
