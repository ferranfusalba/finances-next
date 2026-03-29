"use client";

import { useMemo } from "react";
import { StackedBarChart } from "@carbon/charts-react";
import type { BarChartOptions } from "@carbon/charts-react";
import { ScaleTypes } from "@carbon/charts-react";

import { currency as formatCurrency } from "@/lib/utils";
import type { Salary } from "@/types/Salary";

interface Props {
  salaries: Salary[];
  accountMap: Record<string, string>;
  userLocale: string;
}

// Palette for positive (payment) segments
const POSITIVE_PALETTE = [
  "#3d8c40", "#d4a017", "#4a90d9", "#5cb85c", "#8bc34a", "#cddc39",
];

// Palette for negative (deduction) segments
const NEGATIVE_PALETTE = [
  "#e05555", "#e8a0a0", "#c0392b", "#e74c3c", "#f39c9c", "#d98080",
];

export default function SalariesChartCarbon({ salaries, accountMap, userLocale }: Props) {
  const salariesWithDetails = salaries.filter((s) => s.lines.length > 0);

  const { data, colorMap } = useMemo(() => {
    const positiveConceptColors = new Map<string, string>();
    const negativeConceptColors = new Map<string, string>();
    let posIdx = 0;
    let negIdx = 0;

    const paymentLabel = (payment: Salary["payments"][number]) => {
      const account = accountMap[payment.transaction.accountId] ?? "";
      const payee = payment.transaction.payee || payment.transaction.concept || "";
      const isEmployeeBenefit = payment.transaction.subcategory === "Employee Benefits";
      const prefix = isEmployeeBenefit ? "Net Pay (Employee Benefits)" : "Net Pay";
      const payeePart = payee ? ` (${payee})` : "";
      return account
        ? `${prefix} > ${account}${payeePart}`
        : `${prefix}${payeePart}`;
    };

    const deductionLabel = (concept: string) => `Deductions > ${concept}`;

    // Discover concepts and assign colors
    for (const salary of salariesWithDetails) {
      for (const payment of salary.payments) {
        const label = paymentLabel(payment);
        if (!positiveConceptColors.has(label)) {
          positiveConceptColors.set(label, POSITIVE_PALETTE[posIdx++ % POSITIVE_PALETTE.length]);
        }
      }
      for (const line of salary.lines) {
        const label = deductionLabel(line.concept);
        if (!negativeConceptColors.has(label)) {
          negativeConceptColors.set(label, NEGATIVE_PALETTE[negIdx++ % NEGATIVE_PALETTE.length]);
        }
      }
    }

    // Build flat tabular data for Carbon
    const data: { group: string; month: string; value: number }[] = [];

    const sorted = salariesWithDetails
      .slice()
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    for (const salary of sorted) {
      const dt = new Date(salary.month);
      const monthLabel = dt.toLocaleString(userLocale, { month: "long" });

      for (const line of salary.lines) {
        data.push({
          group: deductionLabel(line.concept),
          month: monthLabel,
          value: -Math.abs(line.amount),
        });
      }

      for (const payment of salary.payments) {
        data.push({
          group: paymentLabel(payment),
          month: monthLabel,
          value: Math.abs(payment.transaction.amount),
        });
      }
    }

    const colorMap: Record<string, string> = {};
    for (const [k, v] of negativeConceptColors) colorMap[k] = v;
    for (const [k, v] of positiveConceptColors) colorMap[k] = v;

    return { data, colorMap };
  }, [salariesWithDetails, accountMap, userLocale]);

  if (salariesWithDetails.length === 0) return null;

  const cur = salaries[0]?.currency ?? "EUR";
  const fmt = formatCurrency(userLocale, cur);

  const options: BarChartOptions = {
    title: "",
    axes: {
      left: {
        mapsTo: "month",
        scaleType: ScaleTypes.LABELS,
      },
      bottom: {
        mapsTo: "value",
        stacked: true,
        ticks: {
          formatter: (v: number | Date) => fmt.format(v as number),
        },
      },
    },
    bars: {
      maxWidth: 40,
    },
    color: {
      scale: colorMap,
    },
    height: `${Math.max(200, salariesWithDetails.length * 60 + 120)}px`,
    theme: "g100" as const,
    legend: {
      alignment: "center" as const,
      truncation: {
        type: "none" as const,
      },
    },
    resizable: true,
    toolbar: {
      enabled: false,
    },
  };

  return (
    <div className="w-full">
      <StackedBarChart data={data} options={options} />
    </div>
  );
}
