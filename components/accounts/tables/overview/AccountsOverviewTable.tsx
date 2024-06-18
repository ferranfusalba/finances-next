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

import countries_code from "@/statics/countries_code.json";
import currencies_code from "@/statics/currencies_code.json";

import { Account } from "@/types/Account";

const columnHelper = createColumnHelper<Account>();

export default function AccountsOverviewTable({
  accounts,
}: {
  accounts: Array<Account>;
}) {
  const countriesCode: {
    [k: string]: {
      name: string;
      "alpha-2": string;
      "emoji-flag": string;
    };
  } = countries_code;

  const currenciesCode: {
    [k: string]: {
      symbol: string;
      name: string;
      symbol_native: string;
      decimal_digits: number;
      rounding: number;
      code: string;
      name_plural: string;
      color0?: string;
      color1?: string;
    };
  } = currencies_code;

  const getCountryFlag = (alpha2Code: string) => {
    return countriesCode[alpha2Code]["emoji-flag"];
  };

  const getCurrencyColor0 = (alpha2Code: string) => {
    return currenciesCode[alpha2Code]["color0"];
  };

  const getCurrencyColor1 = (alpha2Code: string) => {
    return currenciesCode[alpha2Code]["color1"];
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
              getCurrencyColor0(
                info.row.original.defaultCurrency as string
              ) as string
            }
            textColor={
              getCurrencyColor1(
                info.row.original.defaultCurrency as string
              ) as string
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
            {getCountryFlag(info.row.original.country)}
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
