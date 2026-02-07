"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { currency } from "@/lib/utils";

import { AccountTransaction } from "@/types/Transaction";

const columnHelper = createColumnHelper<AccountTransaction>();

export default function AccountTransactionTable({
  accountTransactions,
  initialBalance,
}: {
  accountTransactions: Array<AccountTransaction>;
  initialBalance: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  const handleDeleteTransaction = async (transactionId: string) => {
    startTransition(async () => {
      await fetch(`/api/accounts/transactions/${transactionId}`, {
        method: "DELETE",
      });
      setDeleteDialogOpen(null);
      router.refresh();
    });
  };

  const balanceByTransactionId = useMemo(() => {
    const map = new Map<string, number>();
    let running = initialBalance;
    for (const t of accountTransactions) {
      running += t.amount;
      map.set(t.id, running);
    }
    return map;
  }, [accountTransactions, initialBalance]);

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
    columnHelper.display({
      id: "balance",
      cell: (info) => {
        const transactionId = info.row.original?.id;
        const defaultCurrency = info.row.original?.currency;
        const bal = balanceByTransactionId.get(transactionId) ?? 0;

        return <>{currency("ca-AD", defaultCurrency).format(bal)}</>;
      },
      header: "Balance",
      footer: () => "balance",
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
            <Dialog
              open={deleteDialogOpen === transactionId}
              onOpenChange={(open) =>
                setDeleteDialogOpen(open ? transactionId : null)
              }
            >
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <TrashCan />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Transaction</DialogTitle>
                </DialogHeader>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => handleDeleteTransaction(transactionId)}
                >
                  Confirm
                </Button>
              </DialogContent>
            </Dialog>
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
