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
