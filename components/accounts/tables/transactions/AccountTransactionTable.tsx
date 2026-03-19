"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Close,
  Copy,
  Download,
  Edit as EditIcon,
  Filter,
  Launch,
  Search,
  SettingsAdjust,
  TrashCan,
} from "@carbon/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import AccountTransactionAdd from "@/components/accounts/tables/transactions/AccountTransactionAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn, currency } from "@/lib/utils";
import { downloadTransactionsCsv } from "@/lib/utils/csv";

import { useCollapseMonths } from "@/contexts/CollapseMonthsContext";
import { useTransactionUser } from "@/contexts/TransactionUserContext";

import { Account } from "@/types/Account";
import { type TaxLine, AccountTransaction } from "@/types/Transaction";
import Layout02a1 from "@/components/layouts/Layout02a1";

const columnHelper = createColumnHelper<AccountTransaction>();

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

const COLUMN_LABELS: Record<string, string> = {
  dateTime: "Date & Time",
  payee: "Payee",
  concept: "Concept",
  type: "Type",
  recurring: "Recurring",
  typeTransferOrigin: "Transfer Origin",
  typeTransferDestination: "Transfer Destination",
  currency: "Currency",
  amount: "Amount",
  balance: "Balance",
  foreignCurrency: "Foreign Currency",
  foreignCurrencyAmount: "Foreign Amount",
  foreignCurrencyExchangeRate: "Exchange Rate",
  category: "Category",
  subcategory: "Subcategory",
  tags: "Tags",
  location: "Location",
  taxLines: "Sales Tax",
  notes: "Notes",
  id: "Transaction ID",
};

const NON_TOGGLEABLE_COLUMNS = new Set(["select", "id"]);

interface Props {
  accountTransactions: Array<AccountTransaction>;
  account: Account | null;
  carryForwardBalance?: number;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const hid = searchParams.get("highlightId");
    if (!hid) return;
    const match = accountTransactions.find(
      (tx) => tx.id === hid || tx.transferId === hid,
    );
    if (match) setHighlightedTxId(match.id);
  }, [searchParams, accountTransactions]);

  useEffect(() => {
    if (highlightedTxId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
        toast.success("Transaction deleted successfully");
        setDeleteDialogOpen(null);
        router.refresh();
      } else {
        const json = await res.json();
        toast.error("Failed to delete transaction", {
          description: json.error ?? "Unknown error",
        });
      }
    });
  };

  const hasOpeningTransaction = accountTransactions.some(
    (t) => t.type === "OPENING",
  );

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
        toast.success(
          `${selectedIds.size} transaction(s) deleted successfully`,
        );
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(`Failed to delete ${failed} transaction(s)`);
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
    let running = props.carryForwardBalance ?? 0;
    for (const t of accountTransactions) {
      running += t.amount;
      map.set(t.id, running);
    }
    return map;
  }, [accountTransactions, props.carryForwardBalance]);

  const globalFilterFn = useCallback(
    (
      row: { original: AccountTransaction },
      _columnId: string,
      filterValue: string,
    ) => {
      const q = filterValue.toLowerCase();
      const t = row.original;
      return (
        (t.payee?.toLowerCase().includes(q) ?? false) ||
        (t.concept?.toLowerCase().includes(q) ?? false) ||
        (t.category?.toLowerCase().includes(q) ?? false) ||
        (t.subcategory?.toLowerCase().includes(q) ?? false) ||
        (t.notes?.toLowerCase().includes(q) ?? false) ||
        (t.tags?.some((tag) => tag.toLowerCase().includes(q)) ?? false) ||
        (t.location?.name?.toLowerCase().includes(q) ?? false) ||
        (t.type?.toLowerCase().includes(q) ?? false) ||
        t.id.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    },
    [],
  );

  const columns = [
    columnHelper.display({
      id: "select",
      header: () =>
        accountTransactions.length > 0 ? (
          <input
            type="checkbox"
            checked={selectedIds.size === accountTransactions.length}
            onChange={toggleSelectAll}
            className="cursor-pointer accent-slate-300"
          />
        ) : null,
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
        const tz = info.row.original.timezone;
        return (
          <div>
            <i>{info.getValue().toLocaleString("ca")}</i>
            {tz && <div className="text-xs text-muted-foreground">{tz}</div>}
          </div>
        );
      },
      header: () => <span>Date & Time</span>,
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
    columnHelper.accessor("recurring", {
      cell: (info) => {
        const value = info.getValue();
        if (!value) return null;
        return (
          <Badge variant="secondary" className="select-none">
            {value === "YEARLY" ? "Yearly" : "Monthly"}
          </Badge>
        );
      },
      header: "Recurring",
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
        const currentLabel = props.account
          ? `${props.account.bankName} · ${props.account.name}`
          : "";
        const href = tid
          ? `/accounts/${accountId}?highlightId=${tid}&fromLabel=${encodeURIComponent(currentLabel)}`
          : `/accounts/${accountId}`;
        return (
          <Link href={href} className="underline">
            {label}
          </Link>
        );
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
        const currentLabel = props.account
          ? `${props.account.bankName} · ${props.account.name}`
          : "";
        const href = tid
          ? `/accounts/${accountId}?highlightId=${tid}&fromLabel=${encodeURIComponent(currentLabel)}`
          : `/accounts/${accountId}`;
        return (
          <Link href={href} className="underline">
            {label}
          </Link>
        );
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
      cell: (info) => {
        const value = info.getValue();
        if (!value) return null;
        return <>{value}</>;
      },
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
      cell: (info) => {
        const loc = info.getValue();
        if (!loc) return "";
        return (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name}, ${loc.address}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {loc.name}
            <Launch className="h-3 w-3 shrink-0 text-muted-foreground" />
          </a>
        );
      },
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
        const row = info.row.original;
        const isTransferDestination =
          row?.type === "TRANSFER" &&
          !!row.typeTransferOrigin &&
          row.typeTransferOrigin !== props.account?.id;

        return (
          <div className="flex gap-1 items-center">
            {transactionId}
            <span
              title={
                isTransferDestination
                  ? "Manage this transfer from the origin account"
                  : undefined
              }
            >
              <Button
                variant="ghost"
                aria-label="Copy transaction"
                onClick={() => setCopyTransactionId(transactionId)}
                disabled={hasSelection || isTransferDestination}
              >
                <Copy />
              </Button>
            </span>
            <span
              title={
                isTransferDestination
                  ? "Manage this transfer from the origin account"
                  : undefined
              }
            >
              <Button
                variant="ghost"
                aria-label="Edit transaction"
                onClick={() => setEditTransactionId(transactionId)}
                disabled={hasSelection || isTransferDestination}
              >
                <EditIcon />
              </Button>
            </span>
            <Dialog
              open={deleteDialogOpen === transactionId}
              onOpenChange={(open) =>
                setDeleteDialogOpen(open ? transactionId : null)
              }
            >
              <DialogTrigger asChild>
                <Button variant="ghost" aria-label="Delete transaction">
                  <TrashCan />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Transaction</DialogTitle>
                  <DialogDescription>
                    {row?.type === "TRANSFER"
                      ? "This will also delete the corresponding transaction on the other account. This action cannot be undone."
                      : "This action cannot be undone."}
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
  const { collapsedMonths, toggleMonth } = useCollapseMonths();

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: true,
  });

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  return (
    <>
      <Layout02a1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 select-none h-9"
              >
                <SettingsAdjust className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {table
                .getAllLeafColumns()
                .filter((col) => !NON_TOGGLEABLE_COLUMNS.has(col.id))
                .map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => col.toggleVisibility(!col.getIsVisible())}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        readOnly
                        className="accent-slate-300 cursor-pointer"
                      />
                      {COLUMN_LABELS[col.id] ?? col.id}
                    </label>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-1 select-none h-9"
            onClick={() => {
              setShowFilters((v) => {
                if (v) setColumnFilters([]);
                return !v;
              });
            }}
          >
            <Filter className="h-4 w-4" />
            Filters
            {columnFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {columnFilters.length}
              </Badge>
            )}
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground select-none">
            <span>{totalFiltered} transactions</span>
            <span className="text-slate-600">|</span>
            <label className="flex items-center gap-1">
              Show
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  table.setPageIndex(0);
                }}
                className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-sm text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              per page
            </label>
            {pageCount > 1 && (
              <>
                <span className="text-slate-600">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  {currentPage + 1} / {pageCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Layout02a1>

      <div className="flex flex-col overflow-auto flex-nowrap scroll-touch px-4">
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
                  <DialogTitle>
                    Delete {selectedIds.size} Transaction(s)
                  </DialogTitle>
                  <DialogDescription>
                    {accountTransactions.some(
                      (t) => selectedIds.has(t.id) && t.type === "TRANSFER",
                    )
                      ? "Selected transfers will also delete their corresponding transactions on the other account. This action cannot be undone."
                      : "This action cannot be undone."}
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
        <div className="overflow-auto flex-nowrap scroll-touch">
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
              {showFilters && (
                <tr className="bg-slate-500">
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <th key={header.id} className="px-1 py-1">
                      {header.column.getCanFilter() ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              (header.column.getFilterValue() as string) ?? ""
                            }
                            onChange={(e) =>
                              header.column.setFilterValue(
                                e.target.value || undefined,
                              )
                            }
                            placeholder={COLUMN_LABELS[header.id] ?? ""}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-foreground placeholder:text-slate-500"
                          />
                          {(header.column.getFilterValue() as string) && (
                            <button
                              type="button"
                              onClick={() =>
                                header.column.setFilterValue(undefined)
                              }
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <Close className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              )}
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
                        <td
                          colSpan={colCount}
                          className="px-2 py-1 font-semibold"
                        >
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
                          isHighlighted ? "bg-yellow-900/40" : "bg-slate-900",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
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
                <tr
                  key={footerGroup.id}
                  className="bg-slate-400 text-slate-600"
                >
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
        </div>

        {/* Bottom pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground select-none">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {editTransaction && (
          <AccountTransactionAdd
            key={editTransaction.id}
            account={props.account}
            accountTransactions={accountTransactions}
            editTransaction={editTransaction}
            editOpen={!!editTransactionId}
            onEditOpenChange={(open) => {
              if (!open) setEditTransactionId(null);
            }}
            hasOpeningTransaction={
              editTransaction.type === "OPENING"
                ? accountTransactions.some(
                    (t) => t.type === "OPENING" && t.id !== editTransaction.id,
                  )
                : hasOpeningTransaction
            }
          />
        )}
        {copyTransaction && (
          <AccountTransactionAdd
            key={`copy-${copyTransaction.id}`}
            account={props.account}
            accountTransactions={accountTransactions}
            copyTransaction={copyTransaction}
            editOpen={!!copyTransactionId}
            onEditOpenChange={(open) => {
              if (!open) setCopyTransactionId(null);
            }}
            hasOpeningTransaction={hasOpeningTransaction}
          />
        )}
      </div>
    </>
  );
}
