import { AccountTransaction } from "@/types/Transaction";

export const CSV_HEADERS = [
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
  "Sales Tax",
  "Notes",
  "Transaction ID",
];

export function escapeCsvField(value: unknown): string {
  if (value == null) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function transactionToRow(
  t: AccountTransaction,
  balance: number,
): string {
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
    t.taxLines ? JSON.stringify(t.taxLines) : "",
    t.notes,
    t.id,
  ]
    .map(escapeCsvField)
    .join(",");
}

export function downloadTransactionsCsv(
  transactions: AccountTransaction[],
  filename: string,
) {
  const headerRow = CSV_HEADERS.join(",");
  let running = 0;
  const dataRows = transactions.map((t) => {
    running += t.amount;
    return transactionToRow(t, running);
  });
  const csv = "\uFEFF" + [headerRow, ...dataRows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
