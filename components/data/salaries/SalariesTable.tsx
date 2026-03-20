"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Edit } from "@carbon/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency as formatCurrency } from "@/lib/utils";
import type { Salary } from "@/types/Salary";

export interface SalaryTransaction {
  id: string;
  dateTime: Date;
  payee: string;
  concept: string;
  accountId: string;
  amount: number;
  currency: string;
  salaryId: string | null;
}

interface MonthGroup {
  key: string;
  label: string;
  year: number;
  transactions: SalaryTransaction[];
  salary: Salary | null;
}

interface Props {
  transactions: SalaryTransaction[];
  salaries: Salary[];
  accountMap: Record<string, string>;
  userLocale: string;
  onEditSalary: (monthKey: string, salary: Salary | null, transactions: SalaryTransaction[]) => void;
}

export default function SalariesTable({
  transactions,
  salaries,
  accountMap,
  userLocale,
  onEditSalary,
}: Props) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const salaryMap = useMemo(() => {
    const map = new Map<string, Salary>();
    for (const s of salaries) {
      map.set(s.id, s);
    }
    return map;
  }, [salaries]);

  // Build a map of monthKey -> salaryId from transactions
  const salaryByMonth = useMemo(() => {
    const map = new Map<string, Salary>();
    for (const s of salaries) {
      const dt = new Date(s.month);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, s);
    }
    return map;
  }, [salaries]);

  const grouped = useMemo(() => {
    const map = new Map<string, MonthGroup>();

    for (const t of transactions) {
      const dt = new Date(t.dateTime);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        const salary = t.salaryId ? (salaryMap.get(t.salaryId) ?? null) : (salaryByMonth.get(key) ?? null);
        map.set(key, {
          key,
          label: dt.toLocaleString(userLocale, { year: "numeric", month: "long" }),
          year: dt.getFullYear(),
          transactions: [],
          salary,
        });
      }
      map.get(key)!.transactions.push(t);
    }

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions, salaryMap, salaryByMonth, userLocale]);

  const yearTotals = useMemo(() => {
    const map = new Map<number, { gross: number; deductions: number; net: number; months: number }>();
    for (const group of grouped) {
      const existing = map.get(group.year) ?? { gross: 0, deductions: 0, net: 0, months: 0 };
      const netFromTransactions = group.transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
      existing.months += 1;
      if (group.salary) {
        const totalDeductions = group.salary.lines.reduce((s, l) => s + Math.abs(l.amount), 0);
        existing.gross += group.salary.grossPay;
        existing.deductions += totalDeductions;
        existing.net += group.salary.grossPay - totalDeductions;
      } else {
        existing.net += netFromTransactions;
      }
      map.set(group.year, existing);
    }
    return map;
  }, [grouped]);

  const cur = transactions[0]?.currency ?? "EUR";
  const fmt = (value: number) => formatCurrency(userLocale, cur).format(value);

  const headers = ["Month", "Gross Pay", "Deductions", "Net Pay", "Payments", ""];

  let lastYear = 0;

  return (
    <div className="flex flex-col overflow-auto flex-nowrap scroll-touch w-full">
      <table className="w-full">
        <caption className="sr-only">Salaries</caption>
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
              <td colSpan={headers.length} className="px-2 py-8 text-center text-slate-400">
                No transactions with category &quot;Salary&quot; found.
              </td>
            </tr>
          ) : (
            grouped.map((group) => {
              const elements: React.ReactNode[] = [];

              // Year header
              if (group.year !== lastYear) {
                lastYear = group.year;
                const yt = yearTotals.get(group.year);
                elements.push(
                  <tr key={`year-${group.year}`} className="bg-slate-600 select-none">
                    <td className="px-2 py-1 font-bold text-lg">{group.year}</td>
                    <td className="px-2 py-1 font-bold text-lg">
                      {yt && yt.gross > 0 ? fmt(yt.gross) : ""}
                    </td>
                    <td className="px-2 py-1 font-bold text-lg">
                      {yt && yt.deductions > 0 ? fmt(-yt.deductions) : ""}
                    </td>
                    <td className="px-2 py-1 font-bold text-lg">
                      {yt ? fmt(yt.net) : ""}
                    </td>
                    <td />
                    <td />
                  </tr>,
                );
                if (yt && yt.months > 1) {
                  elements.push(
                    <tr key={`year-avg-${group.year}`} className="bg-slate-600/70 select-none">
                      <td className="px-2 py-0.5 text-sm text-slate-300">
                        Avg / month ({yt.months} months)
                      </td>
                      <td className="px-2 py-0.5 text-sm text-slate-300">
                        {yt.gross > 0 ? fmt(yt.gross / yt.months) : ""}
                      </td>
                      <td className="px-2 py-0.5 text-sm text-slate-300">
                        {yt.deductions > 0 ? fmt(-yt.deductions / yt.months) : ""}
                      </td>
                      <td className="px-2 py-0.5 text-sm text-slate-300">
                        {fmt(yt.net / yt.months)}
                      </td>
                      <td />
                      <td />
                    </tr>,
                  );
                }
              }

              const isCollapsed = collapsedMonths.has(group.key);
              const netFromTransactions = group.transactions.reduce(
                (s, t) => s + Math.abs(t.amount),
                0,
              );
              const salary = group.salary;
              const totalDeductions = salary
                ? salary.lines.reduce((s, l) => s + Math.abs(l.amount), 0)
                : 0;
              const netPay = salary
                ? salary.grossPay - totalDeductions
                : netFromTransactions;

              // Month header row
              elements.push(
                <tr
                  key={`month-${group.key}`}
                  className="bg-slate-700 cursor-pointer select-none"
                  onClick={() => toggleMonth(group.key)}
                >
                  <td className="px-2 py-1 font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                      {group.label}
                      {salary && (
                        <Badge variant="secondary" className="select-none text-xs">
                          {salary.employer}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-1 font-semibold">
                    {salary ? (
                      fmt(salary.grossPay)
                    ) : (
                      <span className="text-sm font-normal text-slate-500 italic">
                        Add details
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1 font-semibold">
                    {salary && totalDeductions > 0 ? fmt(-totalDeductions) : (
                      !salary && (
                        <span className="text-sm font-normal text-slate-500 italic">
                          —
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-2 py-1 font-semibold">{fmt(netPay)}</td>
                  <td className="px-2 py-1 text-sm text-slate-300">
                    {group.transactions.length} payment{group.transactions.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSalary(group.key, salary, group.transactions);
                      }}
                      title={salary ? "Edit salary details" : "Add salary details"}
                    >
                      <Edit size={16} className="mr-1" />
                      {salary ? "Edit" : "Add Details"}
                    </Button>
                  </td>
                </tr>,
              );

              // Expanded content
              if (!isCollapsed) {
                // Deduction lines (if salary record exists)
                if (salary && salary.lines.length > 0) {
                  const linesByGroup = new Map<string, typeof salary.lines>();
                  for (const line of salary.lines) {
                    const existing = linesByGroup.get(line.group) ?? [];
                    existing.push(line);
                    linesByGroup.set(line.group, existing);
                  }

                  for (const [groupName, groupLines] of linesByGroup) {
                    const groupTotal = groupLines.reduce(
                      (s, l) => s + Math.abs(l.amount),
                      0,
                    );

                    // Group header row
                    elements.push(
                      <tr
                        key={`${group.key}-ded-${groupName}`}
                        className="bg-slate-950 select-none"
                      >
                        <td className="pl-8 pr-2 py-1 text-sm font-medium text-slate-300">
                          {groupName}
                        </td>
                        <td className="px-2 py-1" />
                        <td className="px-2 py-1 text-sm font-medium text-slate-300">
                          {fmt(-groupTotal)}
                        </td>
                        <td className="px-2 py-1" />
                        <td className="px-2 py-1" />
                        <td className="px-2 py-1" />
                      </tr>,
                    );

                    // Individual deduction lines
                    for (const line of groupLines) {
                      elements.push(
                        <tr
                          key={`${group.key}-line-${line.id}`}
                          className="bg-slate-950/70"
                        >
                          <td className="pl-14 pr-2 py-1 text-sm text-slate-400">
                            {line.concept}
                          </td>
                          <td className="px-2 py-1" />
                          <td className="pl-6 pr-2 py-1 text-sm text-slate-400">
                            {fmt(-Math.abs(line.amount))}
                          </td>
                          <td className="px-2 py-1" />
                          <td className="px-2 py-1" />
                          <td className="px-2 py-1" />
                        </tr>,
                      );
                    }
                  }
                }

                // Transaction rows
                for (const t of group.transactions) {
                  const dt = new Date(t.dateTime);
                  const account = accountMap[t.accountId] ?? t.accountId;
                  const href = `/accounts/${t.accountId}?highlightId=${t.id}&fromLabel=${encodeURIComponent("Salaries")}`;

                  elements.push(
                    <tr
                      key={t.id}
                      className="border-b border-b-slate-400/20 bg-slate-900"
                    >
                      <td className="px-4 py-0.5 text-sm" colSpan={2}>
                        <span className="text-slate-400">
                          {dt.toLocaleDateString(userLocale, {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {" · "}
                        {t.payee || t.concept}
                        {" · "}
                        <span className="text-slate-400">{account}</span>
                      </td>
                      <td />
                      <td className="px-2 py-0.5 text-sm">
                        {fmt(Math.abs(t.amount))}
                      </td>
                      <td className="px-2 py-0.5 text-sm">
                        <Link href={href} className="underline text-slate-400">
                          View
                        </Link>
                      </td>
                      <td />
                    </tr>,
                  );
                }
              }

              return elements;
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
