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
import { AddTransaction } from "./AddTransaction";

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
  // Default Currency Amount + Balance
  columnHelper.accessor("currency", {
    header: "Currency",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("amount", {
    cell: (info) => {
      const number = info.getValue();

      const intlNumber = new Intl.NumberFormat("de-DE", {
        // style: "currency",
        // currency: "EUR",
      }).format(number);

      return <>{intlNumber}</>;
    },
    header: "Amount",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("balance", {
    cell: (info) => {
      const number = info.getValue();

      const intlNumber = new Intl.NumberFormat("de-DE", {
        // style: "currency",
        // currency: "EUR",
      }).format(number);

      return <>{intlNumber}</>;
    },
    header: "Balance",
    footer: (info) => info.column.id,
  }),
  // IF Foreign Currency
  // TODO: Change it for foreignCurrency
  // columnHelper.accessor("currency", {
  //   header: "Currency",
  //   footer: (info) => info.column.id,
  // }),
  // TODO: Change it for foreignCurrencyAmount
  // columnHelper.accessor("amount", {
  //   cell: (info) => {
  //     const number = info.getValue();

  //     const intlNumber = new Intl.NumberFormat("de-DE", {
  //       // style: "currency",
  //       // currency: "EUR",
  //     }).format(number);

  //     return <>{intlNumber}</>;
  //   },
  //   header: "Original Amount",
  //   footer: (info) => info.column.id,
  // }),
  // TODO: Add exchange rate?
  // IF Foreign Currency ENDS
  columnHelper.accessor("category", {
    header: "Category",
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor("dateTime", {
    header: "Date & Time",
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
  accountId,
  accountTransactions,
}: {
  accountId: number;
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
      <hr />
      Level: {count}
      <hr />
      <AddTransaction accountId={accountId} />
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
