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

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { currency as formatCurrency } from "@/lib/utils";

interface TaxLine {
  rate: number;
  amount: number;
  inclusive: boolean;
  taxAmount: number;
}

interface SalesTaxTransaction {
  id: string;
  dateTime: Date;
  payee: string;
  concept: string;
  accountId: string;
  amount: number;
  currency: string;
  taxLines: TaxLine[];
  totalTax: number;
}

interface Props {
  transactions: SalesTaxTransaction[];
  accountMap: Record<string, string>;
  userLocale?: string;
}

type GroupMode = "percentage" | "month";

const columnHelper = createColumnHelper<SalesTaxTransaction>();

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

  const payeeColumn = columnHelper.accessor("payee", {
    header: "Payee",
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

  const taxColumn = columnHelper.display({
    id: "tax",
    header: "Tax",
    cell: (info) => {
      const row = info.row.original;
      const cur = row.currency;
      return formatCurrency(userLocale, cur).format(row.totalTax);
    },
  });

  if (groupMode === "month") {
    return [dateColumn, payeeColumn, paymentMethodColumn, amountColumn, taxColumn];
  }

  const percentagePayeeColumn = columnHelper.accessor("payee", {
    id: "percentagePayee",
    header: "Payee",
    cell: (info) => info.getValue() || info.row.original.concept || "—",
  });

  const percentageDateColumn = columnHelper.accessor("dateTime", {
    id: "percentageDate",
    header: "Percentage & Date",
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

  return [percentageDateColumn, percentagePayeeColumn, paymentMethodColumn, amountColumn, taxColumn];
}

export default function SalesTaxTable({
  transactions,
  accountMap,
  userLocale = "en-US",
}: Props) {
  const [groupMode, setGroupMode] = useState<GroupMode>("percentage");
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
      ? ["Date", "Payee", "Payment Method", "Amount", "Tax"]
      : ["Percentage & Date", "Payee", "Payment Method", "Amount", "Tax"];

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
          <ToggleGroupItem value="percentage" size="sm">
            By Percentage
          </ToggleGroupItem>
          <ToggleGroupItem value="month" size="sm">
            By Month
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <table className="w-full">
        <caption className="sr-only">Sales tax</caption>
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
          {transactions.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-2 py-8 text-center text-slate-400"
              >
                No transactions with sales tax found
              </td>
            </tr>
          ) : groupMode === "percentage" ? (
            <PercentageGroupedBody
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

// --- Percentage grouping ---

function PercentageGroupedBody({
  transactions,
  columns,
  collapsedGroups,
  toggleGroup,
  userLocale,
}: {
  transactions: SalesTaxTransaction[];
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
        rate: number;
        transactions: SalesTaxTransaction[];
      }
    >();
    for (const t of transactions) {
      // Group by the primary (first) tax rate
      const rate = t.taxLines[0]?.rate ?? 0;
      const key = `${rate}%`;
      if (!map.has(key)) {
        map.set(key, { label: key, rate, transactions: [] });
      }
      map.get(key)!.transactions.push(t);
    }
    return Array.from(map.values()).sort((a, b) => a.rate - b.rate);
  }, [transactions]);

  const grandTotalAmount = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );
  const grandTotalTax = useMemo(
    () => transactions.reduce((sum, t) => sum + t.totalTax, 0),
    [transactions],
  );
  const cur = transactions[0]?.currency ?? "EUR";

  return (
    <>
      <tr className="bg-slate-600 select-none">
        <td colSpan={3} className="px-2 py-1 font-bold text-lg">
          Total
        </td>
        <td className="px-2 py-1 font-bold text-lg">
          {formatCurrency(userLocale, cur).format(grandTotalAmount)}
        </td>
        <td className="px-2 py-1 font-bold text-lg">
          {formatCurrency(userLocale, cur).format(grandTotalTax)}
        </td>
      </tr>
      {grouped.map((group) => {
        const isCollapsed = collapsedGroups.has(group.label);
        const totalAmount = group.transactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const totalTax = group.transactions.reduce(
          (sum, t) => sum + t.totalTax,
          0,
        );
        const count = group.transactions.length;
        const groupCur = group.transactions[0]?.currency ?? "EUR";

        return (
          <PercentageGroup
            key={group.label}
            group={group}
            isCollapsed={isCollapsed}
            onToggle={() => toggleGroup(group.label)}
            count={count}
            totalAmount={totalAmount}
            totalTax={totalTax}
            cur={groupCur}
            userLocale={userLocale}
            columns={columns}
          />
        );
      })}
    </>
  );
}

function PercentageGroup({
  group,
  isCollapsed,
  onToggle,
  count,
  totalAmount,
  totalTax,
  cur,
  userLocale,
  columns,
}: {
  group: { label: string; transactions: SalesTaxTransaction[] };
  isCollapsed: boolean;
  onToggle: () => void;
  count: number;
  totalAmount: number;
  totalTax: number;
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
          </span>
        </td>
        <td className="px-2 py-1 text-sm text-slate-300" colSpan={2}>
          {count} transactions
        </td>
        <td className="px-2 py-1 font-semibold">
          {formatCurrency(userLocale, cur).format(totalAmount)}
        </td>
        <td className="px-2 py-1 font-semibold">
          {formatCurrency(userLocale, cur).format(totalTax)}
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
  transactions: SalesTaxTransaction[];
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

  const { monthlyTotals, yearlyTotals } = useMemo(() => {
    const monthly = new Map<string, { amount: number; tax: number }>();
    const yearly = new Map<number, { amount: number; tax: number }>();
    for (const t of transactions) {
      const dt = new Date(t.dateTime);
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const prev = monthly.get(monthKey) ?? { amount: 0, tax: 0 };
      monthly.set(monthKey, {
        amount: prev.amount + t.amount,
        tax: prev.tax + t.totalTax,
      });
      const year = dt.getFullYear();
      const prevYear = yearly.get(year) ?? { amount: 0, tax: 0 };
      yearly.set(year, {
        amount: prevYear.amount + t.amount,
        tax: prevYear.tax + t.totalTax,
      });
    }
    return { monthlyTotals: monthly, yearlyTotals: yearly };
  }, [transactions]);

  const rows = table.getRowModel().rows;
  const colCount = table.getAllColumns().length;

  const elements: React.ReactNode[] = [];
  let lastMonthKey = "";
  let lastYear = 0;

  for (const row of rows) {
    const dt = new Date(row.original.dateTime);
    const year = dt.getFullYear();
    const monthKey = `${year}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

    if (year !== lastYear) {
      lastYear = year;
      const yearData = yearlyTotals.get(year) ?? { amount: 0, tax: 0 };
      const cur = row.original.currency;
      elements.push(
        <tr key={`year-${year}`} className="bg-slate-600 select-none">
          <td colSpan={colCount - 2} className="px-2 py-1 font-bold text-lg">
            {year}
          </td>
          <td className="px-2 py-1 font-bold text-lg">
            {formatCurrency(userLocale, cur).format(yearData.amount)}
          </td>
          <td className="px-2 py-1 font-bold text-lg">
            {formatCurrency(userLocale, cur).format(yearData.tax)}
          </td>
        </tr>,
      );
    }

    if (monthKey !== lastMonthKey) {
      lastMonthKey = monthKey;
      const isCollapsed = collapsedGroups.has(monthKey);
      const label = dt.toLocaleString(userLocale, {
        year: "numeric",
        month: "long",
      });
      const monthData = monthlyTotals.get(monthKey) ?? { amount: 0, tax: 0 };
      const cur = row.original.currency;

      elements.push(
        <tr
          key={`month-${monthKey}`}
          className="bg-slate-700 cursor-pointer select-none"
          onClick={() => toggleGroup(monthKey)}
        >
          <td colSpan={colCount - 2} className="px-2 py-1 font-semibold">
            <span className="inline-flex items-center gap-1">
              {isCollapsed ? <ChevronRight /> : <ChevronDown />}
              {label}
            </span>
          </td>
          <td className="px-2 py-1 font-semibold">
            {formatCurrency(userLocale, cur).format(monthData.amount)}
          </td>
          <td className="px-2 py-1 font-semibold">
            {formatCurrency(userLocale, cur).format(monthData.tax)}
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
