export const ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "CASH",
  "PREPAID",
  "INVESTMENT",
  "INVESTMENT_CASH",
  "INVESTMENT_LEGACY",
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeValue, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CASH: "Cash",
  PREPAID: "Prepaid",
  INVESTMENT: "Investment",
  INVESTMENT_CASH: "Investment cash",
  INVESTMENT_LEGACY: "Investment (legacy)",
};

/**
 * The types you can pick on the new-account form. Two are deliberately absent:
 *
 *   INVESTMENT_CASH   — not a kind of account you go and open. It is a *leg* of
 *                       an investment account, so you add it from that account
 *                       (see AddCashLeg) rather than from a list where it sits
 *                       as a peer of "Checking" and invites you to create one
 *                       with no parent.
 *   INVESTMENT_LEGACY — exists only to keep the pre-split accounts working.
 *                       Offering it would let you create fresh accounts in the
 *                       model we are trying to retire.
 */
export type SelectableAccountType = Exclude<
  AccountTypeValue,
  "INVESTMENT_CASH" | "INVESTMENT_LEGACY"
>;

// Spelled out rather than filtered: z.enum needs a non-empty tuple, and
// `satisfies` still rejects a member that is not a real, selectable account type.
export const SELECTABLE_ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "CASH",
  "PREPAID",
  "INVESTMENT",
] as const satisfies readonly SelectableAccountType[];

/**
 * What each leg of an investment account is called on its page.
 *
 * The account itself is "Indexa Capital · Fondos", and it *is* the invested
 * position — the cash leg is an appendage the provider maintains on the side.
 * But once both are on screen they read as peers, so they get peer names:
 * calling the first table "Fondos" and the second "Cash" would imply the second
 * sits outside the first. "Invested" and "Cash" say what each actually holds.
 */
export const ACCOUNT_LEG_LABELS: Partial<Record<AccountTypeValue, string>> = {
  INVESTMENT: "Invested",
  INVESTMENT_CASH: "Cash",
};

/** The cash leg hangs off an invested parent; nothing else nests. */
export const PARENT_ACCOUNT_TYPE: Record<string, AccountTypeValue | null> = {
  INVESTMENT_CASH: "INVESTMENT",
};

export function requiredParentAccountType(
  accountType: AccountTypeValue,
): AccountTypeValue | null {
  return PARENT_ACCOUNT_TYPE[accountType] ?? null;
}

export function isAccountType(value: string): value is AccountTypeValue {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

interface LabellableAccount {
  id?: string;
  bankName: string;
  name: string;
  type?: AccountTypeValue;
  parentAccountId?: string | null;
}

interface AccountInList {
  id: string;
  name: string;
  parentAccountId?: string | null;
}

/**
 * How an account reads wherever it is named: a transfer picker, a ledger cell,
 * a dialog.
 *
 *   Ibercaja · Cuenta Vamos                 <- an ordinary account
 *   Indexa Capital · Fondos 2 (Invested)    <- the invested leg of a split pair
 *   Indexa Capital · Fondos 2 (Cash)        <- its cash leg, named through it
 *
 * Once an investment is split, BOTH legs carry their leg name. Neither is
 * meaningful alone: "Indexa Capital · Cash" does not say whose cash it is, and
 * plain "Fondos 2" sitting next to it reads as the whole account rather than one
 * half of it — which is exactly the confusion that makes you transfer into the
 * wrong one.
 *
 * An investment with no cash leg keeps its plain name: there is only one leg, so
 * there is nothing to tell it apart from.
 *
 * `separator` because the pickers use "-" and the tables use "·".
 */
export function accountLabel(
  account: LabellableAccount,
  allAccounts: AccountInList[],
  separator: string = "·",
): string {
  const parent = account.parentAccountId
    ? allAccounts.find((a) => a.id === account.parentAccountId)
    : undefined;

  // A leg: named through its parent, suffixed with its own name ("Cash").
  if (parent) {
    return `${account.bankName} ${separator} ${parent.name} (${account.name})`;
  }

  // The other half of a split pair: suffixed with its leg name ("Invested").
  const hasLegs =
    !!account.id && allAccounts.some((a) => a.parentAccountId === account.id);
  const legLabel = account.type ? ACCOUNT_LEG_LABELS[account.type] : undefined;

  if (hasLegs && legLabel) {
    return `${account.bankName} ${separator} ${account.name} (${legLabel})`;
  }

  return `${account.bankName} ${separator} ${account.name}`;
}

/**
 * The banks the user already has accounts with, de-duplicated and sorted.
 *
 * Case-insensitively de-duplicated, but the first spelling seen is the one
 * kept — "BBVA" and "bbva" are the same bank, and offering both would defeat
 * the point of the picker.
 */
export function uniqueBankNames(
  accounts: Array<{ bankName: string }>,
): string[] {
  const seen = new Map<string, string>();

  for (const { bankName } of accounts) {
    const name = bankName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  }

  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
