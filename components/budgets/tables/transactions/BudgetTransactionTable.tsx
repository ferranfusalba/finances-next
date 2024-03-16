"use client";
import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import "./BudgetTransactionTable.css";
import { BudgetTransaction } from "@/types/Transaction";
import { currency } from "@/lib/utils";

const columnHelper = createColumnHelper<BudgetTransaction>();

const columns = [
  columnHelper.accessor((row) => row.createdAt, {
    id: "createdAt",
    cell: (info) => {
      return <i>{info.getValue().toLocaleString("ca")}</i>;
    },
    header: () => <span>createdAt</span>,
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

      return <>{currency("ca-AD", defaultCurrency).format(number)}</>;
    },
    header: "Amount",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("balance", {
    cell: (info) => {
      const number = info.getValue();
      const defaultCurrency = info.row.original?.currency;

      return <>{currency("ca-AD", defaultCurrency).format(number)}</>;
    },
    header: "Balance",
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

export default function BudgetTransactionTable({
  budgetTransactions,
}: {
  budgetTransactions: Array<BudgetTransaction>;
}) {
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
