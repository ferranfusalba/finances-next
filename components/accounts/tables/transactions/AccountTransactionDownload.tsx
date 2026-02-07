"use client";

import { Download } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

import { AccountTransaction } from "@/types/Transaction";

const CSV_HEADERS = [
  "Date & Time",
  "Timezone",
  "Payee",
  "Concept",
  "Type",
  "Transfer Origin",
  "Transfer Destination",
  "Currency",
  "Amount",
  "Balance",
  "Foreign Currency",
  "Foreign Currency Amount",
  "Exchange Rate",
  "Category",
  "Subcategory",
  "Tags",
  "Location",
  "Notes",
  "Transaction ID",
];

function escapeCsvField(value: unknown): string {
  if (value == null) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function transactionToRow(t: AccountTransaction, balance: number): string {
  return [
    t.dateTime,
    t.timezone,
    t.payee,
    t.concept,
    t.type,
    t.typeTransferOrigin,
    t.typeTransferDestination,
    t.currency,
    t.amount,
    balance,
    t.foreignCurrency,
    t.foreignCurrencyAmount,
    t.foreignCurrencyExchangeRate,
    t.category,
    t.subcategory,
    t.tags,
    t.location,
    t.notes,
    t.id,
  ]
    .map(escapeCsvField)
    .join(",");
}

export default function AccountTransactionDownload({
  accountTransactions,
  accountName,
}: {
  accountTransactions: Array<AccountTransaction>;
  accountName: string;
}) {
  const handleDownload = () => {
    const headerRow = CSV_HEADERS.join(",");
    let running = 0;
    const dataRows = accountTransactions.map((t) => {
      running += t.amount;
      return transactionToRow(t, running);
    });
    const csv = "\uFEFF" + [headerRow, ...dataRows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split("T")[0];

    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${accountName}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleDownload} className="gap-2">
      <Download />
      Download CSV
    </Button>
  );
}
