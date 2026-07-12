import timezones from "@/statics/timezones-iana.json";
import { Timezone } from "@/types/Timezone";

/**
 * Detects the user's timezone by matching the browser's IANA timezone
 * (e.g. "Europe/Zurich") against the id field in timezones-iana.json.
 * Falls back to offset-based matching if no exact match is found.
 */
export function detectTimezone(ianaOverride?: string): Timezone | undefined {
  const iana =
    ianaOverride || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Match by IANA timezone id
  const match = timezones.find((tz) => tz.id === iana);
  if (match) return match;

  // Fallback: match by current UTC offset
  const offsetMinutes = -(new Date().getTimezoneOffset());
  const hours = Math.trunc(offsetMinutes / 60);
  const minutes = Math.abs(offsetMinutes % 60);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetStr =
    minutes === 0
      ? `UTC${sign}${String(Math.abs(hours)).padStart(2, "0")}`
      : `UTC${sign}${String(Math.abs(hours)).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return timezones.find((tz) => tz.offset === offsetStr);
}

/**
 * How far ahead of UTC a zone is, in minutes, at a given instant.
 * Madrid in July -> +120. Toronto in July -> -240.
 */
function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  // Read the zone's wall clock back as if it were UTC; the gap is the offset.
  // `hour` can come back as 24 for midnight, hence the modulo.
  const wallClockAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );

  return (wallClockAsUtc - at.getTime()) / 60_000;
}

/**
 * The instant at which a wall-clock time occurs IN a given timezone.
 *
 *   zonedTimeToUtc(2026, 6, 12, 9, 0, "Europe/Madrid") -> 2026-07-12T07:00:00Z
 *
 * regardless of where the browser running this happens to be.
 *
 * This is the whole point. The instant used to be built with
 * `new Date(y, m, d, hh, mm)`, which composes in the BROWSER's zone — so the
 * same "09:00" entered on holiday in Toronto and at home in Madrid produced two
 * different instants six hours apart, while both rows claimed to be Madrid time.
 * Your bank does not move its clocks when you go away, and neither should this.
 *
 * Two passes, because of DST: the offset that applies is the one in force at the
 * resulting instant, not at the initial guess. One correction is enough — a zone
 * never shifts twice within a single day's worth of slack.
 */
export function zonedTimeToUtc(
  year: number,
  /** 0-indexed, as in `Date.getMonth()`. */
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): Date {
  const asIfUtc = Date.UTC(year, month, day, hours, minutes);

  const guess = asIfUtc - offsetMinutes(timeZone, new Date(asIfUtc)) * 60_000;
  const corrected =
    asIfUtc - offsetMinutes(timeZone, new Date(guess)) * 60_000;

  return new Date(corrected);
}

export interface ZonedParts {
  year: number;
  /** 0-indexed, as in `Date.getMonth()`. */
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

/**
 * The wall clock an instant reads as IN a given timezone.
 *
 * The inverse of zonedTimeToUtc, and needed for the same reason: `.getHours()`
 * reads in the BROWSER's zone, so opening a Madrid transaction from Toronto would
 * show 03:00 in the form — and saving it back would store 03:00 Madrid, quietly
 * moving a row you only meant to look at.
 */
export function zonedParts(at: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month") - 1,
    day: get("day"),
    hours: get("hour") % 24,
    minutes: get("minute"),
  };
}

/**
 * Computes the UTC offset string for a given IANA timezone at a specific date.
 * Accounts for DST — e.g. "Europe/Berlin" returns "UTC+02" in summer, "UTC+01" in winter.
 */
export function getTimezoneOffset(ianaId: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaId,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

  // tzPart is like "GMT+2", "GMT-5:30", or "GMT" for UTC
  const match = tzPart.match(/GMT([+-])?(\d+)?(?::(\d+))?/);
  if (!match) return "";

  const sign = match[1] ?? "+";
  const hours = match[2] ?? "0";
  const minutes = match[3] ?? "";

  return minutes
    ? `UTC${sign}${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
    : `UTC${sign}${hours.padStart(2, "0")}`;
}
