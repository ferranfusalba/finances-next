"use client";

import { Download } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

import { downloadTransactionsCsv } from "@/lib/utils/csv";

import { AccountTransaction } from "@/types/Transaction";

export default function AccountTransactionDownload({
  accountTransactions,
  accountName,
}: {
  accountTransactions: Array<AccountTransaction>;
  accountName: string;
}) {
  const handleDownload = () => {
    const date = new Date().toISOString().split("T")[0];
    downloadTransactionsCsv(
      accountTransactions,
      `transactions-${accountName}-${date}.csv`,
    );
  };

  return (
    <Button variant="outline" onClick={handleDownload} className="gap-2">
      <Download />
      Download CSV
    </Button>
  );
}
