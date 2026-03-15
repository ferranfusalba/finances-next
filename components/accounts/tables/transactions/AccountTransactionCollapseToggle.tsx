"use client";

import { useMemo } from "react";
import { CollapseAll, ExpandAll } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

import { useCollapseMonths } from "@/contexts/CollapseMonthsContext";

import { AccountTransaction } from "@/types/Transaction";

export default function AccountTransactionCollapseToggle({
  accountTransactions,
}: {
  accountTransactions: Array<AccountTransaction>;
}) {
  const { isAllCollapsed, collapseAll, expandAll } = useCollapseMonths();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const t of accountTransactions) {
      const dt = t.dateTime;
      keys.add(
        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
      );
    }
    return Array.from(keys);
  }, [accountTransactions]);

  const handleToggle = () => {
    if (isAllCollapsed) {
      expandAll();
    } else {
      collapseAll(monthKeys, currentMonthKey);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      className="gap-2"
    >
      {isAllCollapsed ? <ExpandAll /> : <CollapseAll />}
      {isAllCollapsed ? "Expand All Months" : "Collapse Months"}
    </Button>
  );
}
