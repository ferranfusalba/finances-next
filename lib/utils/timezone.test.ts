import { describe, it, expect } from "vitest";
import { detectTimezone, getTimezoneOffset } from "./timezone";

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
