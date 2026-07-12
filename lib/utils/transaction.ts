import type { AccountTypeValue } from "@/lib/utils/account";

export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "OPENING"
  | "CONTRIBUTION"
  | "WITHDRAWAL"
  | "FEE"
  | "RETURN"
  | "WITHHOLDING"
  | "ROUNDING";

export const TRANSACTION_TYPES: TransactionType[] = [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
  "OPENING",
  "CONTRIBUTION",
  "WITHDRAWAL",
  "FEE",
  "RETURN",
  "WITHHOLDING",
  "ROUNDING",
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
  OPENING: "Opening",
  CONTRIBUTION: "Contribution",
  WITHDRAWAL: "Withdrawal",
  FEE: "Fee",
  RETURN: "Return",
  WITHHOLDING: "Withholding",
  ROUNDING: "Rounding",
};

export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as string[]).includes(value);
}

/**
 * Which transaction types each kind of account may hold — the single source of
 * the account-type → transaction-type rule.
 *
 * This replaces INVESTMENT_TRANSACTION_TYPES, which stated the same rule in one
 * direction only: it blocked RETURN from landing on a CHECKING account, but
 * never blocked EXPENSE from landing on an INVESTMENT one.
 *
 * OPENING is deliberately absent from every row — see allowedTransactionTypes.
 */
const ALLOWED_TRANSACTION_TYPES: Record<AccountTypeValue, TransactionType[]> = {
  CHECKING: ["INCOME", "EXPENSE", "TRANSFER"],
  SAVINGS: ["INCOME", "EXPENSE", "TRANSFER"],
  CASH: ["INCOME", "EXPENSE", "TRANSFER"],
  PREPAID: ["INCOME", "EXPENSE", "TRANSFER"],

  // The invested position. Nothing but market movement and the transfers that
  // move money in and out of it — every other kind of event belongs on the cash
  // leg, which is where the provider actually posts it.
  INVESTMENT: ["RETURN", "ROUNDING", "TRANSFER"],

  // The cash leg. TRANSFER is money moving to or from an account you track
  // (including the invested sibling); CONTRIBUTION and WITHDRAWAL are the same
  // movements when the other side is somewhere you don't.
  INVESTMENT_CASH: [
    "TRANSFER",
    "CONTRIBUTION",
    "WITHDRAWAL",
    "FEE",
    "WITHHOLDING",
  ],

  // Frozen. This is the pre-split model, and it must keep accepting exactly what
  // it already holds — the existing accounts have INCOME rows, and narrowing this
  // would make the API's type guard reject them on edit, locking real history
  // behind a validation error. Delete this row at cutover, not before.
  INVESTMENT_LEGACY: [
    "INCOME",
    "EXPENSE",
    "TRANSFER",
    "RETURN",
    "WITHHOLDING",
    "ROUNDING",
  ],
};

/**
 * Every type the account may legally hold, for server-side validation.
 *
 * OPENING is appended to every account type rather than living in the table:
 * it is not a property of the *kind* of account, it is the one row every
 * account has exactly once. Use selectableTransactionTypes for the dropdown —
 * an account that already has an opening must not be offered a second one.
 */
export function allowedTransactionTypes(
  accountType: AccountTypeValue,
): TransactionType[] {
  const allowed = ALLOWED_TRANSACTION_TYPES[accountType];
  // Deny by default. An unrecognised account type cannot occur through Prisma
  // (the column is an enum), but this function guards writes, and a guard that
  // throws on unexpected input is worse than one that permits nothing.
  if (!allowed) return [];
  return [...allowed, "OPENING"];
}

/**
 * The types the transaction form offers.
 *
 * OPENING is never among them. It is not something you pick — it is written once
 * when the account is created, and an account that somehow lacks one is prompted
 * to set it by the banner above its transactions table, which opens this same
 * form with the type pre-set and locked. It remains a perfectly valid type
 * server-side (see allowedTransactionTypes); it is simply not a choice.
 */
export function selectableTransactionTypes(
  accountType: AccountTypeValue,
): TransactionType[] {
  return allowedTransactionTypes(accountType).filter(
    (type) => type !== "OPENING",
  );
}

export function isTransactionTypeAllowed(
  accountType: AccountTypeValue,
  type: string,
): boolean {
  return (allowedTransactionTypes(accountType) as string[]).includes(type);
}

/**
 * Whether a type carries the "who / what / where" fields — payee, category,
 * recurring, tags, location, tax lines.
 *
 * Only types that describe a dealing with someone else do. RETURN, FEE,
 * WITHHOLDING, ROUNDING, CONTRIBUTION and WITHDRAWAL describe the account's own
 * mechanics: a market movement has no shop and no VAT, and a contribution's
 * counterparty is the account itself.
 *
 * This is the one field distinction the split needs. The full
 * `transactionType -> visible fields` table lands with the form redesign.
 */
export function hasCounterpartyFields(type: string): boolean {
  return (
    type === "INCOME" ||
    type === "EXPENSE" ||
    type === "TRANSFER" ||
    type === "OPENING"
  );
}

/**
 * How each type contributes to the investment decomposition.
 *
 *   opening          = OPENING row
 *   netContributions = CONTRIBUTION + WITHDRAWAL + TRANSFER rows (signed)
 *   totalReturn      = RETURN rows
 *   totalWithholding = WITHHOLDING rows
 *   totalFees        = FEE rows
 *   roundingAdj      = ROUNDING rows
 *   balance          = all of the above (= SUM of every row)
 *
 * Each of OPENING, RETURN, WITHHOLDING, FEE and ROUNDING is its own bucket
 * because none of them is money you put in *during* the period, and lumping any
 * into contributions would distort it. OPENING especially: it is an accumulated
 * position that already contains years of past returns, so counting it as a
 * contribution would claim you paid in money the market actually made. A FEE is
 * the mirror-image trap — negative, so falling through to CONTRIBUTION would read
 * as money you withdrew and understate what you have paid in.
 *
 * Keyed on the transaction type ALONE, deliberately. The account type would seem
 * to matter — "is this transfer a contribution to the fund, or just cash moving
 * between my own pockets?" — but it works out without it, because a transfer
 * between the two legs of a pair appears on BOTH: −1.000 on cash, +1.000 on
 * invested. Summed over the leg you are looking at, it says the right thing:
 *
 *   invested leg  → +1.000   the fund received a contribution
 *   cash leg      →      0   money in from the bank, straight back out again
 *   both together → +1.000   you contributed 1.000, once
 *
 * The internal hop cancels itself. That is why cash → invested stays a TRANSFER
 * rather than being retyped CONTRIBUTION: the figure is already right, and
 * retyping it would break the mirror pair (PATCH and DELETE find a transfer's
 * partner by `type: "TRANSFER"`) and strand CONTRIBUTION's real job — money
 * arriving from a source you do not track, like a Trade Republic saveback.
 */
export type TransactionBucket =
  | "OPENING"
  | "CONTRIBUTION"
  | "RETURN"
  | "WITHHOLDING"
  | "FEE"
  | "ROUNDING";

export function transactionBucket(type: string): TransactionBucket {
  if (type === "OPENING") return "OPENING";
  if (type === "RETURN") return "RETURN";
  if (type === "WITHHOLDING") return "WITHHOLDING";
  if (type === "FEE") return "FEE";
  if (type === "ROUNDING") return "ROUNDING";
  return "CONTRIBUTION";
}

export interface InvestmentDecomposition {
  opening: number;
  netContributions: number;
  totalReturn: number;
  totalWithholding: number;
  totalFees: number;
  roundingAdj: number;
  /** Equals the sum of every bucket, and therefore the account's balance. */
  balance: number;
}

/**
 * Splits an investment's balance into where it came from.
 *
 * Takes signed amounts straight from the ledger, so the identity
 *
 *   balance = opening + netContributions + totalReturn
 *           + totalWithholding + totalFees + roundingAdj
 *
 * holds by construction rather than by agreement — every row lands in exactly
 * one bucket and nothing is counted twice. Feed it both legs of a pair to get
 * the provider-level figures; feed it one leg for that leg's.
 */
export function decomposeInvestment(
  rows: Array<{ type: string; amount: number }>,
): InvestmentDecomposition {
  const decomposition: InvestmentDecomposition = {
    opening: 0,
    netContributions: 0,
    totalReturn: 0,
    totalWithholding: 0,
    totalFees: 0,
    roundingAdj: 0,
    balance: 0,
  };

  for (const { type, amount } of rows) {
    switch (transactionBucket(type)) {
      case "OPENING":
        decomposition.opening += amount;
        break;
      case "RETURN":
        decomposition.totalReturn += amount;
        break;
      case "WITHHOLDING":
        decomposition.totalWithholding += amount;
        break;
      case "FEE":
        decomposition.totalFees += amount;
        break;
      case "ROUNDING":
        decomposition.roundingAdj += amount;
        break;
      case "CONTRIBUTION":
        decomposition.netContributions += amount;
        break;
    }
    decomposition.balance += amount;
  }

  return decomposition;
}

export interface ReturnPeriod {
  /** The last instant of the month — the date a monthly return is posted on. */
  date: Date;
  /** "March 2026" — what the row's concept says. */
  label: string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * The return period a date falls in: the last day of its month.
 *
 * Returns are monthly — you read them off the provider's statement one month at a
 * time — so every row in the ledger implies the month it needs a return for, and
 * everything about that row is known except the number.
 */
export function returnPeriodForMonth(date: Date | string): ReturnPeriod {
  const d = toDate(date);
  // Day 0 of the next month is the last day of this one.
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0, 0);

  return {
    date: end,
    label: end.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

/** "2026-01" — for telling which months already have a return. */
export function monthKey(date: Date | string): string {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** A month still running has no return to post yet. */
export function isMonthComplete(date: Date | string, now: Date): boolean {
  return returnPeriodForMonth(date).date < now;
}

/**
 * Every month that still needs a return posted.
 *
 * Walks month by month from the one AFTER the account opened — the opening IS the
 * position on its date, so it already contains that month's return, and posting
 * one would count the month twice — up to the last month that has finished.
 *
 * Derived from the calendar, NOT from the rows: a month in which you made no
 * contribution still had a market, and its return is exactly the one you would
 * otherwise have no way to reach. That is why these become rows of their own.
 */
export function pendingReturnPeriods(
  transactions: Array<{ type: string; dateTime: Date | string }>,
  now: Date,
): ReturnPeriod[] {
  const opening = transactions.find((t) => t.type === "OPENING");
  if (!opening) return [];

  const posted = new Set(
    transactions
      .filter((t) => t.type === "RETURN")
      .map((t) => monthKey(t.dateTime)),
  );

  const openedAt = toDate(opening.dateTime);
  const pending: ReturnPeriod[] = [];

  // Month indices past 11 roll into the next year on their own.
  for (let offset = 1; offset <= 1200; offset++) {
    const month = new Date(openedAt.getFullYear(), openedAt.getMonth() + offset, 1);
    if (!isMonthComplete(month, now)) break;
    if (!posted.has(monthKey(month))) pending.push(returnPeriodForMonth(month));
  }

  return pending;
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
 * EXPENSE/TRANSFER/WITHHOLDING/WITHDRAWAL/FEE → always negative
 * INCOME/CONTRIBUTION                         → always positive
 * OPENING/RETURN/ROUNDING                     → raw value, sign preserved
 *
 * RETURN must preserve sign: a losing month is negative (March 2026 was
 * -1.099,94) and forcing it positive would corrupt the balance by twice the
 * amount. OPENING preserves sign because an account may open in the red.
 *
 * There is deliberately no fallthrough — an unrecognised type throws rather than
 * being silently coerced positive.
 */
export function computeTransactionAmount(
  type: string,
  rawAmount: number
): number {
  switch (type) {
    case "EXPENSE":
    case "TRANSFER":
    case "WITHHOLDING":
    case "WITHDRAWAL":
    case "FEE":
      return -Math.abs(rawAmount);
    case "INCOME":
    case "CONTRIBUTION":
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
  transactions: Array<{ dateTime: Date | string; type?: string }>
): string {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth();
  const targetDay = date.getDate();

  const sameDayTxs = transactions.filter((t) => {
    // The opening is not part of the day's flow — it is the account's starting
    // point, and it sits at 00:00. Counting it here would make the first real
    // transaction of the opening day default to 00:01 rather than to 09:00.
    if (t.type === "OPENING") return false;
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
