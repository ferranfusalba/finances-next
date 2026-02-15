import timezones from "@/statics/timezones.json";
import { Timezone } from "@/types/Timezone";

/**
 * Detects the user's timezone by matching the browser's IANA timezone
 * (e.g. "Europe/Zurich") against the utc arrays in timezones.json.
 * Falls back to offset-based matching if no IANA match is found.
 */
export function detectTimezone(ianaOverride?: string): Timezone | undefined {
  const iana =
    ianaOverride || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // First try matching by IANA timezone name against the utc arrays
  const match = timezones.find((tz) =>
    tz.utc.some((u) => u === iana)
  );
  if (match) return match;

  // Fallback: match by numeric offset
  const offsetHours = -(new Date().getTimezoneOffset() / 60);
  return timezones.find((tz) => tz.offset === offsetHours);
}

/**
 * Returns the select value string for a timezone entry,
 * in the format used by the timezone Select component: "offset|text"
 */
export function timezoneToSelectValue(tz: Timezone): string {
  return `${tz.offset}|${tz.text}`;
}
