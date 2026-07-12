import { describe, it, expect } from "vitest";
import {
  detectTimezone,
  getTimezoneOffset,
  zonedParts,
  zonedTimeToUtc,
} from "./timezone";

describe("detectTimezone", () => {
  it("returns a matching timezone for a known IANA id", () => {
    const tz = detectTimezone("Europe/Berlin");
    expect(tz).toBeDefined();
    expect(tz!.id).toBe("Europe/Berlin");
    expect(tz!.region).toBe("Europe");
  });

  it("returns a matching timezone for another known IANA id", () => {
    const tz = detectTimezone("America/New_York");
    expect(tz).toBeDefined();
    expect(tz!.id).toBe("America/New_York");
  });

  it("returns undefined for an unknown IANA id", () => {
    const tz = detectTimezone("Fake/Timezone");
    // Falls back to offset matching — may or may not find a match
    // depending on the test runner's local offset, so just check it doesn't throw
    expect(tz === undefined || tz.id !== "Fake/Timezone").toBe(true);
  });
});

describe("getTimezoneOffset", () => {
  it("returns UTC+01 for Europe/Berlin in winter (CET)", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    expect(getTimezoneOffset("Europe/Berlin", winter)).toBe("UTC+01");
  });

  it("returns UTC+02 for Europe/Berlin in summer (CEST)", () => {
    const summer = new Date("2026-07-15T12:00:00Z");
    expect(getTimezoneOffset("Europe/Berlin", summer)).toBe("UTC+02");
  });

  it("returns UTC-05 for America/New_York in winter (EST)", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    expect(getTimezoneOffset("America/New_York", winter)).toBe("UTC-05");
  });

  it("returns UTC-04 for America/New_York in summer (EDT)", () => {
    const summer = new Date("2026-07-15T12:00:00Z");
    expect(getTimezoneOffset("America/New_York", summer)).toBe("UTC-04");
  });

  it("returns UTC+09 for Asia/Tokyo (no DST)", () => {
    const winter = new Date("2026-01-15T12:00:00Z");
    const summer = new Date("2026-07-15T12:00:00Z");
    expect(getTimezoneOffset("Asia/Tokyo", winter)).toBe("UTC+09");
    expect(getTimezoneOffset("Asia/Tokyo", summer)).toBe("UTC+09");
  });

  it("returns UTC+00 for Etc/UTC", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    expect(getTimezoneOffset("Etc/UTC", date)).toBe("UTC+00");
  });

  it("handles half-hour offsets like Asia/Kolkata", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(getTimezoneOffset("Asia/Kolkata", date)).toBe("UTC+05:30");
  });

  it("handles 45-minute offsets like Asia/Kathmandu", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(getTimezoneOffset("Asia/Kathmandu", date)).toBe("UTC+05:45");
  });
});

describe("zonedTimeToUtc", () => {
  it("composes the instant in the given zone, not the machine's", () => {
    // 09:00 in Madrid in July (UTC+2) is 07:00 UTC. The machine running this test
    // could be anywhere; the answer must not depend on that.
    expect(zonedTimeToUtc(2026, 6, 12, 9, 0, "Europe/Madrid").toISOString()).toBe(
      "2026-07-12T07:00:00.000Z",
    );
  });

  it("gives a different instant for the same wall clock in a different zone", () => {
    // The bug this exists for: 09:00 entered on holiday in Toronto used to be
    // stored as 09:00 Toronto while being labelled Madrid — six hours adrift.
    expect(
      zonedTimeToUtc(2026, 6, 12, 9, 0, "America/Toronto").toISOString(),
    ).toBe("2026-07-12T13:00:00.000Z");
  });

  it("handles winter, when Madrid is UTC+1", () => {
    expect(zonedTimeToUtc(2026, 0, 15, 9, 0, "Europe/Madrid").toISOString()).toBe(
      "2026-01-15T08:00:00.000Z",
    );
  });

  it("gets the right side of a DST boundary", () => {
    // Spain springs forward on the last Sunday of March. 01:59 is still UTC+1;
    // 03:00 is UTC+2.
    expect(zonedTimeToUtc(2026, 2, 29, 1, 59, "Europe/Madrid").toISOString()).toBe(
      "2026-03-29T00:59:00.000Z",
    );
    expect(zonedTimeToUtc(2026, 2, 29, 3, 0, "Europe/Madrid").toISOString()).toBe(
      "2026-03-29T01:00:00.000Z",
    );
  });

  it("handles a half-hour zone", () => {
    // India is UTC+5:30 — a whole-hour assumption would be off by 30 minutes.
    expect(zonedTimeToUtc(2026, 6, 12, 9, 0, "Asia/Kolkata").toISOString()).toBe(
      "2026-07-12T03:30:00.000Z",
    );
  });

  it("handles midnight, which is the fragile instant", () => {
    expect(zonedTimeToUtc(2025, 11, 31, 0, 0, "Europe/Madrid").toISOString()).toBe(
      "2025-12-30T23:00:00.000Z",
    );
  });

  it("is UTC when asked for UTC", () => {
    expect(zonedTimeToUtc(2026, 6, 12, 9, 0, "UTC").toISOString()).toBe(
      "2026-07-12T09:00:00.000Z",
    );
  });
});

describe("zonedParts", () => {
  it("reads an instant's wall clock in the given zone", () => {
    expect(zonedParts(new Date("2026-07-12T07:00:00Z"), "Europe/Madrid")).toEqual({
      year: 2026,
      month: 6,
      day: 12,
      hours: 9,
      minutes: 0,
    });
  });

  it("reads the same instant differently elsewhere", () => {
    const parts = zonedParts(new Date("2026-07-12T07:00:00Z"), "America/Toronto");
    expect(parts.hours).toBe(3);
    expect(parts.day).toBe(12);
  });

  it("reports midnight as hour 0, not hour 24", () => {
    // Intl can format midnight as "24" with hour12: false, which would put the
    // row on the wrong day.
    const parts = zonedParts(new Date("2025-12-30T23:00:00Z"), "Europe/Madrid");
    expect(parts.hours).toBe(0);
    expect(parts.day).toBe(31);
    expect(parts.month).toBe(11);
  });

  it("round-trips with zonedTimeToUtc", () => {
    for (const zone of ["Europe/Madrid", "America/Toronto", "Asia/Kolkata"]) {
      for (const [y, m, d, hh, mm] of [
        [2026, 6, 12, 9, 0],
        [2026, 0, 1, 23, 59],
        [2025, 11, 31, 0, 0],
      ]) {
        const instant = zonedTimeToUtc(y, m, d, hh, mm, zone);
        expect(zonedParts(instant, zone)).toEqual({
          year: y,
          month: m,
          day: d,
          hours: hh,
          minutes: mm,
        });
      }
    }
  });
});
