"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

interface CollapseMonthsContextValue {
  collapsedMonths: Set<string>;
  toggleMonth: (monthKey: string) => void;
  collapseAll: (monthKeys: string[], currentMonthKey: string) => void;
  expandAll: () => void;
  isAllCollapsed: boolean;
}

const CollapseMonthsContext =
  createContext<CollapseMonthsContextValue | null>(null);

export function CollapseMonthsProvider({ children }: { children: ReactNode }) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );

  const value = useMemo<CollapseMonthsContextValue>(
    () => ({
      collapsedMonths,
      toggleMonth: (monthKey: string) => {
        setCollapsedMonths((prev) => {
          const next = new Set(prev);
          if (next.has(monthKey)) {
            next.delete(monthKey);
          } else {
            next.add(monthKey);
          }
          return next;
        });
      },
      collapseAll: (monthKeys: string[], currentMonthKey: string) => {
        setCollapsedMonths(
          new Set(monthKeys.filter((key) => key !== currentMonthKey)),
        );
      },
      expandAll: () => {
        setCollapsedMonths(new Set());
      },
      isAllCollapsed: collapsedMonths.size > 0,
    }),
    [collapsedMonths],
  );

  return (
    <CollapseMonthsContext.Provider value={value}>
      {children}
    </CollapseMonthsContext.Provider>
  );
}

export function useCollapseMonths(): CollapseMonthsContextValue {
  const ctx = useContext(CollapseMonthsContext);
  if (!ctx) {
    throw new Error(
      "useCollapseMonths must be used within a CollapseMonthsProvider",
    );
  }
  return ctx;
}
