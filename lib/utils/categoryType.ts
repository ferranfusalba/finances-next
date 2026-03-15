export type CategoryType = "INCOME" | "EXPENSE" | "TRANSFER";

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
