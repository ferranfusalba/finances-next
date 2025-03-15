"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import { TrashCan } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

import "@/components/accounts/tables/transactions/AccountTransactionTable.css";

import { currency } from "@/lib/utils";

import { AccountTransaction } from "@/types/Transaction";

const columnHelper = createColumnHelper<AccountTransaction>();

export default function AccountTransactionTable({
  accountTransactions,
}: {
  accountTransactions: Array<AccountTransaction>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // TODO: Finish delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    const params = {
      id: transactionId,
    };

    startTransition(async () => {
      await fetch(`/api/accounts/transactions/${params.id}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  };

  const columns = [
    columnHelper.accessor((row) => row.dateTime, {
      id: "dateTime",
      cell: (info) => {
        return <i>{info.getValue().toLocaleString("ca")}</i>;
      },
      header: () => <span>Date & Time</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("timezone", {
      header: "Timezone (offset)",
      footer: (info) => info.column.id,
    }),
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
    columnHelper.accessor("typeTransferOrigin", {
      cell: (info) => {
        const type = info.row.original?.type;

        if (type === "TRANSFER") {
          return <>{info.getValue()}</>;
        }

        return <></>;
      },
      header: "Transfer Origin Account",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("typeTransferDestination", {
      cell: (info) => {
        return info.getValue();
      },
      header: "Transfer Destination Account",
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

        return (
          <div style={{ display: "flex" }}>
            {transactionId}
            <Button
              variant="destructive"
              // disabled={isPending}
              disabled={true} // TODO: Finish delete transaction
              onClick={() => handleDeleteTransaction(transactionId)}
            >
              <TrashCan />
            </Button>
          </div>
        );
      },
      header: "Transaction ID",
      footer: (info) => info.column.id,
    }),
  ];

  const data = accountTransactions;

  type ColumnSort = {
    id: string;
    desc: boolean;
  };

  type SortingState = ColumnSort[];

  // Sorting by dateTime on client to ensure it is presented correctly - TODO: enhance it maybe?
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateTime", desc: false },
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
