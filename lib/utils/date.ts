import { zonedTimeToUtc } from "@/lib/utils/timezone";

/**
 * The same calendar day, at midday, IN a given timezone.
 *
 * Two problems, one function.
 *
 * The date picker hands you midnight, and midnight is the fragile instant: stored
 * and read back across a timezone shift it can slide onto the previous day, which
 * for an opening balance is the difference between "before every transaction" and
 * "one hour after the first one". Midday has twelve hours of slack either way.
 *
 * And the zone is the ACCOUNT's, not the browser's. Your bank does not move its
 * clocks when you go on holiday. An opening dated 31 December is 31 December in
 * Madrid whether you set it from Madrid or from Toronto.
 */
export function atMiddayInZone(date: Date, timeZone: string): Date {
  return zonedTimeToUtc(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    timeZone,
  );
}
