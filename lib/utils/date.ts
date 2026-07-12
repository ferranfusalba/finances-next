import { zonedTimeToUtc } from "@/lib/utils/timezone";

/**
 * The very start of a calendar day, IN a given timezone.
 *
 * The opening is the moment the account begins, so it sits at the first instant
 * of its date and everything on that date and after comes cleanly afterwards.
 * It used to be pinned to midday, as a hedge against midnight sliding onto the
 * adjacent day across a timezone shift — but that hedge cost more than it saved:
 * a midday opening REJECTED a same-day transaction entered before noon, which is
 * exactly what the transaction form's own 09:00 default produces.
 *
 * The hedge is no longer needed either. The instant is composed in the account's
 * zone rather than the browser's, and the ledger renders each row back in its own
 * zone, so midnight in Madrid stays midnight in Madrid from anywhere.
 *
 * The zone is the ACCOUNT's, not the browser's: your bank does not move its
 * clocks when you go on holiday.
 */
export function atStartOfDayInZone(date: Date, timeZone: string): Date {
  return zonedTimeToUtc(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    timeZone,
  );
}
