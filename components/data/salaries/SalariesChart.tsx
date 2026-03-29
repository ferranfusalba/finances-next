"use client";

import { useMemo, useRef } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { ParentSize } from "@visx/responsive";
import { useTooltip } from "@visx/tooltip";

import { currency as formatCurrency } from "@/lib/utils";
import type { Salary } from "@/types/Salary";

interface Props {
  salaries: Salary[];
  accountMap: Record<string, string>;
  userLocale: string;
}

/** A single segment in one month's bar */
interface Segment {
  concept: string;
  value: number; // positive for payments, negative for deductions
  color: string;
}

interface ChartMonth {
  label: string;
  segments: Segment[];
}

interface TooltipData {
  concept: string;
  value: number;
  month: string;
}

// Palette for positive (payment) segments
const POSITIVE_PALETTE = [
  "#3d8c40", "#d4a017", "#4a90d9", "#5cb85c", "#8bc34a", "#cddc39",
];

// Palette for negative (deduction) segments
const NEGATIVE_PALETTE = [
  "#e05555", "#e8a0a0", "#c0392b", "#e74c3c", "#f39c9c", "#d98080",
];

function SalariesChartInner({
  salaries,
  accountMap,
  userLocale,
  width,
  height,
}: Props & { width: number; height: number }) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<TooltipData>();

  const chartRef = useRef<HTMLDivElement>(null);

  const cur = salaries[0]?.currency ?? "EUR";
  const fmt = (value: number) => formatCurrency(userLocale, cur).format(value);

  const { months, legendItems, minValue, maxValue } = useMemo(() => {
    // Assign stable colors per concept across all months
    const positiveConceptColors = new Map<string, string>();
    const negativeConceptColors = new Map<string, string>();
    let posIdx = 0;
    let negIdx = 0;

    // Helper: build payment label as "Net Pay (Employee Benefits) > Bank · Account (Payee)"
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

    // Helper: build deduction label as "Deductions > Concept"
    const deductionLabel = (concept: string) => `Deductions > ${concept}`;

    // First pass: discover all concepts and assign colors
    for (const salary of salaries) {
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

    // Second pass: build chart data
    const months: ChartMonth[] = salaries
      .slice()
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((salary) => {
        const dt = new Date(salary.month);
        const monthLabel = dt.toLocaleString(userLocale, { month: "long" });
        const segments: Segment[] = [];

        // Negative segments: deduction lines
        for (const line of salary.lines) {
          const label = deductionLabel(line.concept);
          segments.push({
            concept: label,
            value: -Math.abs(line.amount),
            color: negativeConceptColors.get(label)!,
          });
        }

        // Positive segments: actual payment transactions
        for (const payment of salary.payments) {
          const label = paymentLabel(payment);
          segments.push({
            concept: label,
            value: Math.abs(payment.transaction.amount),
            color: positiveConceptColors.get(label)!,
          });
        }

        return { label: monthLabel, segments };
      });

    // Compute extent
    let minValue = 0;
    let maxValue = 0;
    for (const m of months) {
      let posSum = 0;
      let negSum = 0;
      for (const seg of m.segments) {
        if (seg.value >= 0) posSum += seg.value;
        else negSum += seg.value;
      }
      minValue = Math.min(minValue, negSum);
      maxValue = Math.max(maxValue, posSum);
    }

    // Build legend: negative first, then positive
    const legendItems = [
      ...Array.from(negativeConceptColors.entries()).map(([concept, color]) => ({
        concept,
        color,
      })),
      ...Array.from(positiveConceptColors.entries()).map(([concept, color]) => ({
        concept,
        color,
      })),
    ];

    return { months, legendItems, minValue, maxValue };
  }, [salaries, accountMap, userLocale]);

  if (months.length === 0 || width < 10) return null;

  const margin = { top: 40, right: 40, bottom: 50, left: 100 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const yScale = scaleBand<string>({
    domain: months.map((m) => m.label),
    range: [0, yMax],
    padding: 0.3,
  });

  const xScale = scaleLinear<number>({
    domain: [minValue * 1.1, maxValue * 1.1],
    range: [0, xMax],
    nice: true,
  });

  return (
    <div ref={chartRef} className="relative">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2 justify-center select-none">
        {legendItems.map((item) => (
          <div key={item.concept} className="flex items-center gap-1.5 text-xs text-slate-300">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            {item.concept}
          </div>
        ))}
      </div>

      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          {/* Vertical grid lines at each 250 tick */}
          {Array.from(
            { length: Math.ceil(maxValue / 250) + Math.ceil(-minValue / 250) + 1 },
            (_, i) => (i - Math.ceil(-minValue / 250)) * 250,
          ).map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={yMax}
              stroke={tick === 0 ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.1)"}
              strokeWidth={1}
            />
          ))}

          {months.map((month) => {
            const barY = yScale(month.label) ?? 0;
            const barHeight = yScale.bandwidth();

            // Stack negative segments left from zero
            let negX = 0;
            const negSegments = month.segments.filter((s) => s.value < 0);
            const negRects = negSegments.map((seg) => {
              const w = Math.abs(xScale(seg.value) - xScale(0));
              negX -= w;
              return { ...seg, x: xScale(0) + negX, width: w };
            });

            // Stack positive segments right from zero
            let posX = xScale(0);
            const posSegments = month.segments.filter((s) => s.value >= 0);
            const posRects = posSegments.map((seg) => {
              const w = Math.abs(xScale(seg.value) - xScale(0));
              const rect = { ...seg, x: posX, width: w };
              posX += w;
              return rect;
            });

            return [...negRects, ...posRects].map((rect, i) => (
              <Bar
                key={`${month.label}-${rect.concept}-${i}`}
                x={rect.x}
                y={barY}
                width={rect.width}
                height={barHeight}
                fill={rect.color}
                rx={2}
                onMouseMove={(event) => {
                  const container = chartRef.current;
                  if (!container) return;
                  const bounds = container.getBoundingClientRect();
                  showTooltip({
                    tooltipData: {
                      concept: rect.concept,
                      value: rect.value,
                      month: month.label,
                    },
                    tooltipLeft: event.clientX - bounds.left + 12,
                    tooltipTop: event.clientY - bounds.top - 12,
                  });
                }}
                onMouseLeave={hideTooltip}
              />
            ));
          })}

          <AxisLeft
            scale={yScale}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={{
              fill: "#94a3b8",
              fontSize: 13,
              fontFamily: "var(--font-ibm-plex-sans)",
              textAnchor: "end",
              dy: "0.33em",
            }}
          />

          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="rgba(148, 163, 184, 0.3)"
            tickStroke="rgba(148, 163, 184, 0.3)"
            tickFormat={(v) => fmt(v as number)}
            tickLabelProps={{
              fill: "#94a3b8",
              fontSize: 11,
              fontFamily: "var(--font-ibm-plex-sans)",
              textAnchor: "middle",
            }}
            tickValues={Array.from(
              { length: Math.ceil(maxValue / 250) + Math.ceil(-minValue / 250) + 1 },
              (_, i) => (i - Math.ceil(-minValue / 250)) * 250,
            )}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <div
          className="pointer-events-none absolute z-10 bg-slate-800 border border-slate-600 text-slate-200 rounded-md px-3 py-2 text-sm shadow-lg"
          style={{ top: tooltipTop, left: tooltipLeft }}
        >
          <div className="font-medium">{tooltipData.concept}</div>
          <div>{tooltipData.month}: {fmt(tooltipData.value)}</div>
        </div>
      )}
    </div>
  );
}

export default function SalariesChart({ salaries, accountMap, userLocale }: Props) {
  // Only show chart for months that have salary details
  const salariesWithDetails = salaries.filter((s) => s.lines.length > 0);

  if (salariesWithDetails.length === 0) return null;

  const barHeight = 40;
  const chartHeight = Math.max(200, salariesWithDetails.length * barHeight + 120);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ParentSize>
        {({ width, height }) => (
          <SalariesChartInner
            salaries={salariesWithDetails}
            accountMap={accountMap}
            userLocale={userLocale}
            width={width}
            height={height}
          />
        )}
      </ParentSize>
    </div>
  );
}
