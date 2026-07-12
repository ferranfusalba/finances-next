import { describe, expect, it } from "vitest";

import { atStartOfDayInZone } from "./date";

describe("atStartOfDayInZone", () => {
  it("lands on the first instant of the day in that zone", () => {
    // 00:00 on 31 Dec in Madrid (UTC+1 in winter) is 23:00 UTC on the 30th.
    const opening = atStartOfDayInZone(
      new Date(2025, 11, 31),
      "Europe/Madrid",
    );

    expect(opening.toISOString()).toBe("2025-12-30T23:00:00.000Z");
  });

  it("comes before a same-day transaction at the form's default 09:00", () => {
    // The whole reason for start-of-day rather than midday. A midday opening
    // rejected a 09:00 transaction on its own date — which is exactly what the
    // transaction form produces by default.
    const opening = atStartOfDayInZone(new Date(2026, 2, 12), "Europe/Madrid");
    const nineAm = new Date("2026-03-12T09:00:00+01:00");

    expect(opening.getTime()).toBeLessThan(nineAm.getTime());
  });

  it("uses the account's zone, not the machine's", () => {
    // Set from a hotel in Toronto, the opening is still midnight in Madrid.
    expect(
      atStartOfDayInZone(new Date(2025, 11, 31), "Europe/Madrid").toISOString(),
    ).toBe("2025-12-30T23:00:00.000Z");
    expect(
      atStartOfDayInZone(
        new Date(2025, 11, 31),
        "America/Toronto",
      ).toISOString(),
    ).toBe("2025-12-31T05:00:00.000Z");
  });

  it("is midnight in summer too, when Madrid is UTC+2", () => {
    expect(
      atStartOfDayInZone(new Date(2026, 6, 12), "Europe/Madrid").toISOString(),
    ).toBe("2026-07-11T22:00:00.000Z");
  });
});
