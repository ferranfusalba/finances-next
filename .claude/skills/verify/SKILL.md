---
name: verify
description: Drive the finances-next Next.js app end-to-end to observe a change actually working — launch, log in, create accounts, drive the transaction form, and probe the API guards. Use when verifying a change to accounts, transactions, the transaction form, or the API routes.
---

# Verifying finances-next

The app is a Next.js 15 app with a Postgres/Prisma backend, NextAuth login, and a
Playwright e2e harness that already solves the two hard parts: **seeding a verified
user** and **logging in past the rate limiter**. Reuse it — do not hand-roll a login.

## The handle

Write a throwaway spec in `e2e/` (Playwright's `testDir` is `./e2e`, so a file
elsewhere won't be picked up), run it, then delete it.

```bash
npx playwright test e2e/zz-verify-<thing>.spec.ts --reporter=line
rm -f e2e/zz-verify-<thing>.spec.ts && rm -rf test-results
```

`playwright.config.ts` has `webServer: { command: "npm run dev", reuseExistingServer: true }`,
so the dev server boots automatically. No separate launch step.

## Spec skeleton

```ts
import { test, expect } from "./helpers/test";       // NOT @playwright/test
import { resetTestData, seedVerifiedUser, testEmail, createTestAccount } from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("verify-x");
const USER_PASSWORD = "testpassword123";

test.describe("verify x", () => {
  let accountId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
    const acct = await createTestAccount(user.id, {
      name: "Fondos", code: "V.INV", bankName: "Indexa Capital", type: "INVESTMENT",
    });
    accountId = acct.id;
  });

  test.afterAll(async () => { await resetTestData(); });

  test("...", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${accountId}`);
    // ...
  });
});
```

**Import `test` from `./helpers/test`, never `@playwright/test`.** The helper gives each
test its own `x-forwarded-for`, so tests don't all share the login rate-limit bucket
(5 per 60s per IP). Import the wrong one and logins fail nondeterministically.

`createTestAccount(userId, { type })` takes any `AccountType` and defaults to `CHECKING`.
There is **no** `createTestTransaction` helper — transactions are created through the UI
(or by POSTing to the API, below).

## Driving the transaction form

```ts
await page.goto(`/accounts/${accountId}`);
await page.getByRole("button", { name: /add/i }).first().click();  // "Add Transaction"
await page.getByRole("combobox", { name: "Type" }).click();
const options = await page.getByRole("option").allTextContents();  // read the type list
await page.getByRole("option", { name: "Return", exact: true }).click();
await page.locator("#concept").fill("March market movement");
await page.locator("#amountForm").fill("-1099.94");
await page.getByRole("button", { name: "Save" }).click();          // submit is "Save"
```

Gotchas that cost time:
- Fields are `id`-addressable (`#concept`, `#amountForm`) but **not** label-associated —
  `getByLabel("Concept")` times out. Use the locator.
- The submit button is **"Save"**, not "Add"/"Create".
- `EditAccount` lives on the **account detail page** (`/accounts/[id]`), not the accounts
  list. Trigger: `getByRole("button", { name: "Edit account" })`.
- The type dropdown animates in; a screenshot taken immediately catches it mid-fade. Add a
  short wait if you need a clean frame.
- After submitting, `router.refresh()` is async — `waitForTimeout(3000)` before reading the
  table back.

## Probing the API directly

The UI filters and disables things; that proves nothing about a hostile payload. Use
`page.request` — it carries the logged-in session cookie:

```ts
const res = await page.request.post("/api/accounts/transactions/", {
  data: { payee: "", concept: "x", currency: "EUR", category: "", notes: "",
          dateTime: new Date().toISOString(),
          type: "RETURN", amount: 500, accountId: checkingId },
});
expect(res.status()).toBe(400);   // RETURN is not valid on a CHECKING account
```

Worth probing on any account/transaction change: a transaction type the account may not
hold, an unknown type (`"BANANA"`), account-type mutation via `PUT /api/accounts/[id]`
(it is stripped, so expect 200 + unchanged type), and a legal write to confirm the guard
isn't refusing everything.

## Do not

- `npm run lint` is **broken** (`next lint` gets a bad arg — "no such directory: .../lint").
  Pre-existing; not your change.
- The dev DB has known migration drift (a Budget-removal migration created but never
  applied). Don't run `prisma migrate dev` casually — it would reset.
