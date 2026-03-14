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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

type GroupMode = "payee" | "month";

const columnHelper = createColumnHelper<RecurringPayment>();

function buildColumns(
  groupMode: GroupMode,
  userLocale: string,
  accountMap: Record<string, string>,
) {
  const dateColumn = columnHelper.accessor("dateTime", {
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
  });

  const conceptColumn = columnHelper.accessor("payee", {
    header: "Concept",
    cell: (info) => info.getValue() || info.row.original.concept || "—",
  });

  const paymentMethodColumn = columnHelper.accessor("accountId", {
    header: "Payment Method",
    cell: (info) => accountMap[info.getValue()] ?? info.getValue(),
  });

  const amountColumn = columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => {
      const value = info.getValue();
      const cur = info.row.original.currency;
      return formatCurrency(userLocale, cur).format(value);
    },
  });

  if (groupMode === "month") {
    return [dateColumn, conceptColumn, paymentMethodColumn, amountColumn];
  }
  return [dateColumn, paymentMethodColumn, amountColumn];
}

export default function RecurringPaymentsTable({
  transactions,
  accountMap,
  userLocale = "en-US",
}: Props) {
  const [groupMode, setGroupMode] = useState<GroupMode>("payee");
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

  const handleGroupModeChange = (mode: GroupMode) => {
    setGroupMode(mode);
    setCollapsedGroups(new Set());
  };

  const columns = useMemo(
    () => buildColumns(groupMode, userLocale, accountMap),
    [groupMode, userLocale, accountMap],
  );

  const headers =
    groupMode === "month"
      ? ["Date", "Concept", "Payment Method", "Amount"]
      : ["Date", "Payment Method", "Amount"];

  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch w-full">
      <div className="flex items-center justify-between pb-2">
        <ToggleGroup
          type="single"
          value={groupMode}
          onValueChange={(val) => {
            if (val) handleGroupModeChange(val as GroupMode);
          }}
          className="select-none"
        >
          <ToggleGroupItem value="payee" size="sm">
            By Payee
          </ToggleGroupItem>
          <ToggleGroupItem value="month" size="sm">
            By Month
          </ToggleGroupItem>
        </ToggleGroup>
        <Link
          href="/settings/presets"
          className="text-sm text-muted-foreground underline select-none"
        >
          Manage recurring presets
        </Link>
      </div>
      <table className="w-full">
        <caption className="sr-only">Recurring payments</caption>
        <thead>
          <tr className="bg-slate-400">
            {headers.map((header) => (
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
          {groupMode === "payee" ? (
            <PayeeGroupedBody
              transactions={transactions}
              columns={columns}
              collapsedGroups={collapsedGroups}
              toggleGroup={toggleGroup}
              userLocale={userLocale}
            />
          ) : (
            <MonthGroupedBody
              transactions={transactions}
              columns={columns}
              collapsedGroups={collapsedGroups}
              toggleGroup={toggleGroup}
              userLocale={userLocale}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Payee grouping ---

function PayeeGroupedBody({
  transactions,
  columns,
  collapsedGroups,
  toggleGroup,
  userLocale,
}: {
  transactions: RecurringPayment[];
  columns: ReturnType<typeof buildColumns>;
  collapsedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  userLocale: string;
}) {
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        recurring: string | null;
        transactions: RecurringPayment[];
      }
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

  return (
    <>
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

        return (
          <PayeeGroup
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
            columns={columns}
          />
        );
      })}
    </>
  );
}

function PayeeGroup({
  group,
  isCollapsed,
  onToggle,
  count,
  avgAmount,
  totalAmount,
  frequencyLabel,
  cur,
  userLocale,
  columns,
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
  columns: ReturnType<typeof buildColumns>;
}) {
  const table = useReactTable({
    data: group.transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
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
          {count} payments · avg{" "}
          {formatCurrency(userLocale, cur).format(avgAmount)}
        </td>
        <td className="px-2 py-1 font-semibold">
          {formatCurrency(userLocale, cur).format(totalAmount)}
        </td>
      </tr>
      {!isCollapsed &&
        rows.map((row) => (
          <tr key={row.id} className="border-b border-b-slate-400 bg-slate-900">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
    </>
  );
}

// --- Month grouping ---

function MonthGroupedBody({
  transactions,
  columns,
  collapsedGroups,
  toggleGroup,
  userLocale,
}: {
  transactions: RecurringPayment[];
  columns: ReturnType<typeof buildColumns>;
  collapsedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  userLocale: string;
}) {
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const dt = new Date(t.dateTime);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  const rows = table.getRowModel().rows;
  const colCount = table.getAllColumns().length;

  const elements: React.ReactNode[] = [];
  let lastMonthKey = "";

  for (const row of rows) {
    const dt = new Date(row.original.dateTime);
    const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

    if (monthKey !== lastMonthKey) {
      lastMonthKey = monthKey;
      const isCollapsed = collapsedGroups.has(monthKey);
      const label = dt.toLocaleString(userLocale, {
        year: "numeric",
        month: "long",
      });
      const total = monthlyTotals.get(monthKey) ?? 0;
      const cur = row.original.currency;

      elements.push(
        <tr
          key={`month-${monthKey}`}
          className="bg-slate-700 cursor-pointer select-none"
          onClick={() => toggleGroup(monthKey)}
        >
          <td colSpan={colCount - 1} className="px-2 py-1 font-semibold">
            <span className="inline-flex items-center gap-1">
              {isCollapsed ? <ChevronRight /> : <ChevronDown />}
              {label}
            </span>
          </td>
          <td className="px-2 py-1 font-semibold">
            {formatCurrency(userLocale, cur).format(total)}
          </td>
        </tr>,
      );
    }

    if (!collapsedGroups.has(monthKey)) {
      elements.push(
        <tr key={row.id} className="border-b border-b-slate-400 bg-slate-900">
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="px-2">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>,
      );
    }
  }

  return <>{elements}</>;
}
