"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "@carbon/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { currency as formatCurrency } from "@/lib/utils";

interface RecurringPayment {
  id: string;
  dateTime: Date;
  payee: string;
  concept: string;
  accountId: string;
  amount: number;
  currency: string;
  recurring: string | null;
}

interface Props {
  transactions: RecurringPayment[];
  accountMap: Record<string, string>;
  userLocale?: string;
}

const columnHelper = createColumnHelper<RecurringPayment>();

export default function RecurringPaymentsTable({
  transactions,
  accountMap,
  userLocale = "en-US",
}: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Group transactions by payee/concept
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { label: string; recurring: string | null; transactions: RecurringPayment[] }
    >();
    for (const t of transactions) {
      const label = t.payee || t.concept || "Unknown";
      if (!map.has(label)) {
        map.set(label, { label, recurring: t.recurring, transactions: [] });
      }
      map.get(label)!.transactions.push(t);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [transactions]);

  const columns = [
    columnHelper.accessor("dateTime", {
      header: "Date",
      cell: (info) => {
        const dt = new Date(info.getValue());
        const row = info.row.original;
        const href = `/accounts/${row.accountId}?highlightId=${row.id}`;
        return (
          <span className="flex items-center gap-2">
            <span>
              {dt.toLocaleDateString(userLocale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <Link href={href} className="underline">
              View
            </Link>
          </span>
        );
      },
    }),
    columnHelper.accessor("accountId", {
      header: "Payment Method",
      cell: (info) => accountMap[info.getValue()] ?? info.getValue(),
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => {
        const value = info.getValue();
        const cur = info.row.original.currency;
        return formatCurrency(userLocale, cur).format(value);
      },
    }),
  ];

  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch w-full">
      <table className="w-full">
        <caption className="sr-only">Recurring payments</caption>
        <thead>
          <tr className="bg-slate-400">
            {["Date", "Payment Method", "Amount"].map((header) => (
              <th
                scope="col"
                key={header}
                className="text-start px-2 border-r border-r-slate-900 font-bold select-none"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const totalAmount = group.transactions.reduce(
              (sum, t) => sum + t.amount,
              0,
            );
            const count = group.transactions.length;
            const avgAmount = totalAmount / count;
            const cur = group.transactions[0]?.currency ?? "EUR";
            const frequencyLabel =
              group.recurring === "YEARLY" ? "Yearly" : "Monthly";

            // Per-group table for collapsed rows
            const groupTable = useReactTable({
              data: group.transactions,
              columns,
              getCoreRowModel: getCoreRowModel(),
            });

            return (
              <GroupRows
                key={group.label}
                group={group}
                isCollapsed={isCollapsed}
                onToggle={() => toggleGroup(group.label)}
                count={count}
                avgAmount={avgAmount}
                totalAmount={totalAmount}
                frequencyLabel={frequencyLabel}
                cur={cur}
                userLocale={userLocale}
                table={groupTable}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  isCollapsed,
  onToggle,
  count,
  avgAmount,
  totalAmount,
  frequencyLabel,
  cur,
  userLocale,
  table,
}: {
  group: { label: string; transactions: RecurringPayment[] };
  isCollapsed: boolean;
  onToggle: () => void;
  count: number;
  avgAmount: number;
  totalAmount: number;
  frequencyLabel: string;
  cur: string;
  userLocale: string;
  table: ReturnType<typeof useReactTable<RecurringPayment>>;
}) {
  const rows = table.getRowModel().rows;

  return (
    <>
      <tr
        className="bg-slate-700 cursor-pointer select-none"
        onClick={onToggle}
      >
        <td className="px-2 py-1 font-semibold">
          <span className="inline-flex items-center gap-2">
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
            {group.label}
            <Badge variant="secondary" className="select-none">
              {frequencyLabel}
            </Badge>
          </span>
        </td>
        <td className="px-2 py-1 text-sm text-slate-300">
          {count} payments · avg {formatCurrency(userLocale, cur).format(avgAmount)}
        </td>
        <td className="px-2 py-1 font-semibold">
          {formatCurrency(userLocale, cur).format(totalAmount)}
        </td>
      </tr>
      {!isCollapsed &&
        rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-b-slate-400 bg-slate-900"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-2">
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                )}
              </td>
            ))}
          </tr>
        ))}
    </>
  );
}
