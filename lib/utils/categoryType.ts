export type CategoryType = "INCOME" | "EXPENSE" | "TRANSFER";

/**
 * RETURN, WITHHOLDING and ROUNDING are deliberately absent.
 *
 * They carry no category: a market movement has no payee and no spending
 * category, and a RETURN is unrealized — it must never be counted as income.
 * Absence here means transactionTypeToCategoryType returns null for them, which
 * suppresses the category autocreate call on the transaction form.
 */
const CATEGORY_TYPE_MAP: Record<string, CategoryType> = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  OPENING: "EXPENSE",
  TRANSFER: "TRANSFER",
};

export function transactionTypeToCategoryType(
  txType: string,
): CategoryType | null {
  return CATEGORY_TYPE_MAP[txType] ?? null;
}
