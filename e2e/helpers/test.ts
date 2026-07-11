import { test as base, expect } from "@playwright/test";

/**
 * Playwright's `test`, with each test given its own client identity.
 *
 * The login action rate-limits to 5 requests per 60s, keyed on the client IP:
 *
 *   getClientIp() -> headers["x-forwarded-for"]?.split(",")[0] ?? "unknown"
 *
 * Playwright never sends that header, so every test in the suite fell into the
 * single "unknown" bucket and contended over one global counter. The suite does
 * far more than 5 logins a minute, so tests failed depending on what else had
 * run recently — transactions.spec alone logs in 7 times and could not pass even
 * on its own.
 *
 * Sharing a server-side counter is a test-isolation bug, not a limiter bug. Giving
 * each test a distinct client identity fixes the isolation: every test gets its
 * own bucket, the limiter still runs for real, and no production code changes.
 *
 * `retry` is in the key so a retried test doesn't inherit its own earlier attempts.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({}, use, testInfo) => {
    await use({
      "x-forwarded-for": `e2e-${testInfo.testId}-${testInfo.retry}`,
    });
  },
});

export { expect };
