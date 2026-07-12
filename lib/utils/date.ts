/**
 * The same calendar day, at midday.
 *
 * A date picker gives you midnight local time. Stored and read back across a
 * timezone shift, midnight can slide onto the previous or the next day — which
 * for an opening balance is the difference between "before every transaction"
 * and "one hour after the first one", and the opening-date rule would reject it.
 * Midday has twelve hours of slack in each direction.
 */
export function atMidday(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  );
}
