export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "OPENING"
  | "RETURN"
  | "WITHHOLDING"
  | "ROUNDING";

export const TRANSACTION_TYPES: TransactionType[] = [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
  "OPENING",
  "RETURN",
  "WITHHOLDING",
  "ROUNDING",
];

/** Types only ever posted to an INVESTMENT account. */
export const INVESTMENT_TRANSACTION_TYPES: TransactionType[] = [
  "RETURN",
  "WITHHOLDING",
  "ROUNDING",
];

export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as string[]).includes(value);
}

/**
 * How each type contributes to the investment decomposition.
 *
 *   netContributions = CONTRIBUTION rows
 *   totalWithholding = WITHHOLDING rows
 *   totalReturn      = RETURN rows
 *   roundingAdj      = ROUNDING rows
 *   balance          = all of the above (= SUM of every row)
 *
 * ROUNDING is deliberately its own bucket: a cent of provider rounding drift is
 * neither money you put in nor money the market made, and must never flatter
 * either figure.
 */
export type TransactionBucket =
  | "CONTRIBUTION"
  | "RETURN"
  | "WITHHOLDING"
  | "ROUNDING";

export function transactionBucket(type: string): TransactionBucket {
  if (type === "RETURN") return "RETURN";
  if (type === "WITHHOLDING") return "WITHHOLDING";
  if (type === "ROUNDING") return "ROUNDING";
  return "CONTRIBUTION";
}

export interface FormTaxLine {
  rate: string;
  amount: string;
  inclusive: boolean;
}

export interface ApiTaxLine {
  rate: number;
  amount: number;
  inclusive: boolean;
  taxAmount: number;
}

/**
 * Applies the correct sign to a transaction amount based on its type.
 *
 * EXPENSE/TRANSFER/WITHHOLDING → always negative
 * INCOME                       → always positive
 * OPENING/RETURN/ROUNDING      → raw value, sign preserved
 *
 * RETURN must preserve sign: a losing month is negative (March 2026 was
 * -1.099,94) and forcing it positive would corrupt the balance by twice the
 * amount. There is deliberately no fallthrough — an unrecognised type throws
 * rather than being silently coerced positive.
 */
export function computeTransactionAmount(
  type: string,
  rawAmount: number
): number {
  switch (type) {
    case "EXPENSE":
    case "TRANSFER":
    case "WITHHOLDING":
      return -Math.abs(rawAmount);
    case "INCOME":
      return Math.abs(rawAmount);
    case "OPENING":
    case "RETURN":
    case "ROUNDING":
      return rawAmount;
    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }
}

/**
 * Computes the tax amount for a single tax line.
 * Inclusive: tax is embedded in the amount → amount × (rate / (100 + rate))
 * Exclusive: tax is added on top → amount × (rate / 100)
 */
export function computeTaxAmount(
  rate: number,
  amount: number,
  inclusive: boolean
): number {
  if (rate <= 0 || amount <= 0) return 0;
  return inclusive
    ? amount * (rate / (100 + rate))
    : amount * (rate / 100);
}

/**
 * Computes the total tax across multiple form tax lines.
 */
export function computeTotalTax(
  lines: Array<FormTaxLine | undefined | null>
): number {
  return (lines || []).reduce((sum, line) => {
    if (!line) return sum;
    const r = parseFloat(line.rate || "0");
    const a = parseFloat(line.amount || "0");
    const tax = computeTaxAmount(r, a, line.inclusive);
    return sum + (isNaN(tax) ? 0 : tax);
  }, 0);
}

/**
 * Converts form tax lines (string values) to API format (numbers).
 * Returns null when there are no valid lines.
 */
export function convertFormTaxLines(
  formLines: FormTaxLine[]
): ApiTaxLine[] | null {
  if (formLines.length === 0) return null;
  const valid = formLines
    .filter((line) => line.rate !== "")
    .map((line) => {
      const rate = parseFloat(line.rate);
      const amount = parseFloat(line.amount);
      return {
        rate,
        amount,
        inclusive: line.inclusive,
        taxAmount: computeTaxAmount(rate, amount, line.inclusive),
      };
    });
  return valid.length > 0 ? valid : null;
}

/**
 * Advances the time counter by 1 minute.
 * Wraps back to 540 (09:00) when reaching 1440 (24:00).
 * Returns { nextCounter, time } where time is "HH:MM".
 */
export function nextTimeIncrement(currentMinutes: number): {
  nextCounter: number;
  time: string;
} {
  const h = Math.floor(currentMinutes / 60);
  const m = currentMinutes % 60;
  return {
    nextCounter: currentMinutes + 1 >= 1440 ? 540 : currentMinutes + 1,
    time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
  };
}

/**
 * Computes the next time for a new transaction on a given date.
 * If no transactions exist on that date, returns "09:00".
 * Otherwise, takes the latest transaction time on that date and adds 1 minute.
 */
export function getNextTimeForDate(
  date: Date,
  transactions: Array<{ dateTime: Date | string }>
): string {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth();
  const targetDay = date.getDate();

  const sameDayTxs = transactions.filter((t) => {
    const d = t.dateTime instanceof Date ? t.dateTime : new Date(t.dateTime);
    return (
      d.getFullYear() === targetYear &&
      d.getMonth() === targetMonth &&
      d.getDate() === targetDay
    );
  });

  if (sameDayTxs.length === 0) {
    return "09:00";
  }

  let latestMinutes = 0;
  for (const t of sameDayTxs) {
    const d = t.dateTime instanceof Date ? t.dateTime : new Date(t.dateTime);
    const minutes = d.getHours() * 60 + d.getMinutes();
    if (minutes > latestMinutes) {
      latestMinutes = minutes;
    }
  }

  const next = latestMinutes + 1 >= 1440 ? 540 : latestMinutes + 1;
  const h = Math.floor(next / 60);
  const m = next % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
