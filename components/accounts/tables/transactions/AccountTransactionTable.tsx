"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Copy, Download, Edit as EditIcon, TrashCan } from "@carbon/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn, currency } from "@/lib/utils";
import { downloadTransactionsCsv } from "@/lib/utils/csv";

import { useTransactionUser } from "@/contexts/TransactionUserContext";

import { Account } from "@/types/Account";
import { type TaxLine, AccountTransaction } from "@/types/Transaction";

const columnHelper = createColumnHelper<AccountTransaction>();

interface Props {
  accountTransactions: Array<AccountTransaction>;
  account: Account | null;
}

export default function AccountTransactionTable(props: Props) {
  const { accountTransactions } = props;
  const { userLocale, userAccounts } = useTransactionUser();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(
    null,
  );
  const [copyTransactionId, setCopyTransactionId] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const tid = searchParams.get("transferId");
    if (!tid) return;
    const match = accountTransactions.find(
      (tx) => tx.transferId === tid,
    );
    if (match) {
      setHighlightedTxId(match.id);
    }
  }, [searchParams, accountTransactions]);

  useEffect(() => {
    if (highlightedTxId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedTxId]);

  const editTransaction = editTransactionId
    ? (accountTransactions.find((t) => t.id === editTransactionId) ?? null)
    : null;

  const copyTransaction = copyTransactionId
    ? (accountTransactions.find((t) => t.id === copyTransactionId) ?? null)
    : null;

  const handleDeleteTransaction = async (transactionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/accounts/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Transaction deleted successfully");
        setDeleteDialogOpen(null);
        router.refresh();
      } else {
        const json = await res.json();
        toast("Failed to delete transaction", {
          description: json.error ?? "Unknown error",
        });
      }
    });
  };

  const hasSelection = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === accountTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(accountTransactions.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    startTransition(async () => {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/accounts/transactions/${id}`, { method: "DELETE" }),
        ),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) {
        toast(`${selectedIds.size} transaction(s) deleted successfully`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast(`Failed to delete ${failed} transaction(s)`);
      }
    });
  };

  const handleBulkDownload = () => {
    const selected = accountTransactions.filter((t) => selectedIds.has(t.id));
    const date = new Date().toISOString().split("T")[0];
    downloadTransactionsCsv(selected, `transactions-selected-${date}.csv`);
  };

  const balanceByTransactionId = useMemo(() => {
    const map = new Map<string, number>();
    let running = 0;
    for (const t of accountTransactions) {
      running += t.amount;
      map.set(t.id, running);
    }
    return map;
  }, [accountTransactions]);

  const columns = [
    columnHelper.display({
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={
            accountTransactions.length > 0 &&
            selectedIds.size === accountTransactions.length
          }
          onChange={toggleSelectAll}
          className="cursor-pointer accent-slate-300"
        />
      ),
      cell: (info) => (
        <input
          type="checkbox"
          checked={selectedIds.has(info.row.original.id)}
          onChange={() => toggleSelect(info.row.original.id)}
          className="cursor-pointer accent-slate-300"
        />
      ),
      footer: () => null,
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
        if (type !== "TRANSFER") return <></>;
        const accountId = info.getValue();
        const account = userAccounts.find((a) => a.id === accountId);
        if (!account) return <>{accountId}</>;
        const label = `${account.bankName} · ${account.name}`;
        if (accountId === props.account?.id) return <>{label}</>;
        const tid = info.row.original.transferId;
        const href = tid
          ? `/accounts/${accountId}?transferId=${tid}`
          : `/accounts/${accountId}`;
        return <Link href={href} className="underline">{label}</Link>;
      },
      header: "Transfer Origin Account",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("typeTransferDestination", {
      cell: (info) => {
        const accountId = info.getValue();
        if (!accountId) return <></>;
        const account = userAccounts.find((a) => a.id === accountId);
        if (!account) return <>{accountId}</>;
        const label = `${account.bankName} · ${account.name}`;
        if (accountId === props.account?.id) return <>{label}</>;
        const tid = info.row.original.transferId;
        const href = tid
          ? `/accounts/${accountId}?transferId=${tid}`
          : `/accounts/${accountId}`;
        return <Link href={href} className="underline">{label}</Link>;
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

        return <>{currency(userLocale, defaultCurrency).format(number)}</>;
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

        return <>{currency(userLocale, defaultCurrency).format(bal)}</>;
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
              {currency(userLocale, foreignCurrency as string).format(
                number as number,
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
      cell: (info) => {
        const tags = info.getValue();
        if (!tags?.length) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="select-none">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("location", {
      header: "Location",
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("taxLines", {
      header: "Sales Tax",
      cell: (info) => {
        const lines = info.getValue() as TaxLine[] | null;
        if (!lines?.length) return "";
        const txCurrency = info.row.original?.currency;
        return lines
          .map((l) => {
            const label = l.inclusive ? "incl." : "excl.";
            return l.taxAmount != null
              ? `${l.rate}% ${label} (${currency(userLocale, txCurrency).format(l.taxAmount)})`
              : `${l.rate}% ${label}`;
          })
          .join(", ");
      },
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
          <div style={{ display: "flex", gap: "4px" }}>
            {transactionId}
            <Button
              variant="outline"
              aria-label="Copy transaction"
              onClick={() => setCopyTransactionId(transactionId)}
              disabled={hasSelection}
            >
              <Copy />
            </Button>
            <Button
              variant="outline"
              aria-label="Edit transaction"
              onClick={() => setEditTransactionId(transactionId)}
              disabled={hasSelection}
            >
              <EditIcon />
            </Button>
            <Dialog
              open={deleteDialogOpen === transactionId}
              onOpenChange={(open) =>
                setDeleteDialogOpen(open ? transactionId : null)
              }
            >
              <DialogTrigger asChild>
                <Button variant="destructive" aria-label="Delete transaction">
                  <TrashCan />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Transaction</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone.
                  </DialogDescription>
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

  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateTime", desc: false },
  ]);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

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
      {hasSelection && (
        <div className="flex items-center gap-2 px-2 py-2 bg-slate-800 rounded-t-md">
          <span className="text-sm select-none">
            {selectedIds.size} selected
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <TrashCan /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {selectedIds.size} Transaction(s)</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={handleBulkDelete}
              >
                Confirm
              </Button>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleBulkDownload}
          >
            <Download /> Download CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}
      <table>
        <caption className="sr-only">Account transactions</caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-slate-400">
              {headerGroup.headers.map((header) => (
                <th
                  scope="col"
                  key={header.id}
                  className="text-start px-2 border-r border-r-slate-900 font-bold"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {(() => {
            const rows = table.getRowModel().rows;
            const elements: React.ReactNode[] = [];
            let lastMonthKey = "";
            const colCount = table.getAllColumns().length;

            for (const row of rows) {
              const dt = row.original.dateTime;
              const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

              if (monthKey !== lastMonthKey) {
                lastMonthKey = monthKey;
                const isCollapsed = collapsedMonths.has(monthKey);
                const label = dt.toLocaleString(userLocale, {
                  year: "numeric",
                  month: "long",
                });

                elements.push(
                  <tr
                    key={`month-${monthKey}`}
                    className="bg-slate-700 cursor-pointer select-none"
                    onClick={() => toggleMonth(monthKey)}
                  >
                    <td colSpan={colCount} className="px-2 py-1 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                        {label}
                      </span>
                    </td>
                  </tr>,
                );
              }

              if (!collapsedMonths.has(monthKey)) {
                const isHighlighted = row.original.id === highlightedTxId;
                elements.push(
                  <tr
                    key={row.id}
                    ref={isHighlighted ? highlightRef : undefined}
                    className={cn(
                      "border-b border-b-slate-400",
                      isHighlighted
                        ? "bg-yellow-900/40"
                        : "bg-slate-900",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>,
                );
              }
            }

            return elements;
          })()}
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
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      {editTransaction && (
        <AccountTransactionAdd
          key={editTransaction.id}
          account={props.account}
          editTransaction={editTransaction}
          editOpen={!!editTransactionId}
          onEditOpenChange={(open) => {
            if (!open) setEditTransactionId(null);
          }}
        />
      )}
      {copyTransaction && (
        <AccountTransactionAdd
          key={`copy-${copyTransaction.id}`}
          account={props.account}
          copyTransaction={copyTransaction}
          editOpen={!!copyTransactionId}
          onEditOpenChange={(open) => {
            if (!open) setCopyTransactionId(null);
          }}
        />
      )}
    </div>
  );
}
