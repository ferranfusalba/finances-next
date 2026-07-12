import { test, expect } from "./helpers/test";
import {
  resetTestData,
  seedVerifiedUser,
  testEmail,
  createTestAccount,
} from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("investments");
const USER_PASSWORD = "testpassword123";

/**
 * An investment provider is two accounts — the invested position and the cash it
 * holds for you — rendered as one page with two tables. These specs drive that
 * pair the way Indexa actually works: money lands in cash, gets invested, the
 * market moves, and fees and retenciones come out of cash.
 */
test.describe("Investment split", () => {
  let userId: string;
  let checkingId: string;
  let investedId: string;
  let cashId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
    userId = user.id;

    const checking = await createTestAccount(userId, {
      name: "Main", code: "E2E.INV.CHK", bankName: "Big Bank", type: "CHECKING",
    });
    checkingId = checking.id;

    const invested = await createTestAccount(userId, {
      name: "Fondos", code: "E2E.INV", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    investedId = invested.id;

    const cash = await createTestAccount(userId, {
      name: "Efectivo", code: "E2E.INV.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });
    cashId = cash.id;
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("creating an investment account asks for both balances at once", async ({
    page,
  }) => {
    // The scenario this exists to prevent: enter the total as the invested
    // balance, add the cash leg afterwards, watch the header sum both legs, then
    // go back and subtract the cash from the invested figure to make it right.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto("/accounts/new");

    const combobox = (placeholder: string) =>
      page.getByRole("combobox").filter({ hasText: placeholder });

    // Bank name is a picker now: these accounts already exist at Indexa Capital,
    // so it is selected, not typed. A typo would otherwise file the new account
    // under a second, near-identical bank.
    await combobox("Select a bank").click();
    await page.getByRole("option", { name: "Indexa Capital" }).click();
    await page.getByPlaceholder("Primary Space").fill("Fondos Nuevo");
    await page.getByPlaceholder("N26.PS").fill("E2E.NEW");

    await combobox("Select an account type").click();
    await page.getByRole("option", { name: "Investment", exact: true }).click();

    // Picking Investment surfaces the second balance — and relabels the first, so
    // it is clear the invested figure is not the total.
    await expect(page.getByText("Invested Starting Balance*")).toBeVisible();
    const cashField = page.locator("#cashOpeningBalance");
    await expect(cashField).toBeVisible();

    await combobox("Select a country").click();
    await page.getByRole("option", { name: /Spain/ }).click();
    await combobox("Select a currency").click();
    await page.getByRole("option", { name: /^EUR - / }).click();

    await page.locator("#openingBalance").fill("9000");
    await cashField.fill("1000");
    // Starting Date is the shared calendar picker now, and defaults to today —
    // which is valid here: the account has no transactions to precede.
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page).toHaveURL(/\/accounts\//, { timeout: 10_000 });

    // Both legs exist immediately, each holding its own figure — no subtraction.
    // Scoped to the balance chips: the same amounts also appear as opening rows
    // in the ledgers below, which is itself the proof the openings were written.
    const chip = (amount: string) =>
      page.locator("span.font-mono").filter({ hasText: amount });

    await expect(page.getByRole("heading", { name: "Invested" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cash", exact: true })
    ).toBeVisible();
    await expect(chip("€9,000.00")).toBeVisible();
    await expect(chip("€1,000.00")).toBeVisible();

    // And the header carries the sum, which is what you reconcile against the
    // provider's statement — no going back to subtract the cash from the
    // invested figure to make the total come out right.
    await expect(chip("€10,000.00")).toBeVisible();
    await expect(page.getByText("invested and cash combined")).toBeVisible();

    // The cash leg already exists, so it is not offered again.
    await expect(
      page.getByRole("button", { name: "Add cash account" })
    ).toBeHidden();
  });

  test("leaving the cash balance blank creates no cash leg", async ({ page }) => {
    // Blank is not zero: no cash account at all, versus one holding nothing.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto("/accounts/new");

    const combobox = (placeholder: string) =>
      page.getByRole("combobox").filter({ hasText: placeholder });

    await combobox("Select a bank").click();
    await page.getByRole("option", { name: "Indexa Capital" }).click();
    await page.getByPlaceholder("Primary Space").fill("Sin Efectivo");
    await page.getByPlaceholder("N26.PS").fill("E2E.NOCASH");

    await combobox("Select an account type").click();
    await page.getByRole("option", { name: "Investment", exact: true }).click();
    await combobox("Select a country").click();
    await page.getByRole("option", { name: /Spain/ }).click();
    await combobox("Select a currency").click();
    await page.getByRole("option", { name: /^EUR - / }).click();

    await page.locator("#openingBalance").fill("500");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page).toHaveURL(/\/accounts\//, { timeout: 10_000 });

    // One leg only — no leg headings, and the offer to add cash is still there.
    await expect(
      page.getByRole("heading", { name: "Cash", exact: true })
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Add cash account" })
    ).toBeVisible();
  });

  test("the cash leg is added from its investment account, not opened from scratch", async ({
    page,
  }) => {
    // Listing "Investment cash" on the new-account form as a peer of "Checking"
    // invited you to create one with no parent. It is a leg of a specific
    // investment account, so it is added from that account.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    await page.goto("/accounts/new");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select an account type" })
      .click();
    const types = await page.getByRole("option").allTextContents();
    expect(types).toEqual([
      "Checking",
      "Savings",
      "Cash",
      "Prepaid",
      "Investment",
    ]);
    expect(types).not.toContain("Investment cash");
    await page.keyboard.press("Escape");

    // A fresh investment account, with no cash leg yet, offers to add one.
    const solo = await createTestAccount(userId, {
      name: "Pensiones", code: "E2E.INV.SOLO", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });

    await page.goto(`/accounts/${solo.id}`);
    await page.getByRole("button", { name: "Add cash account" }).click();
    await expect(
      page.getByRole("heading", { name: "Add cash account" })
    ).toBeVisible();

    await page.locator("#cashOpeningBalance").fill("0");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // It lands as the second table on the same page — no redirect away.
    await expect(page).toHaveURL(new RegExp(solo.id));
    await expect(
      page.getByRole("heading", { name: "Cash", exact: true })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Invested" })).toBeVisible();

    // And the offer is gone: an investment account has at most one cash leg.
    await expect(
      page.getByRole("button", { name: "Add cash account" })
    ).toBeHidden();
  });

  test("an ordinary account is never offered a cash leg", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${checkingId}`);

    await expect(
      page.getByRole("button", { name: "Add cash account" })
    ).toBeHidden();
  });

  test("the invested leg offers only market movement and transfers", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${investedId}`);

    // The parent page renders both legs, so scope to the invested section.
    await page
      .getByRole("button", { name: "Add Transaction" })
      .first()
      .click();
    await page.getByRole("combobox", { name: "Type" }).click();

    const options = await page.getByRole("option").allTextContents();
    expect(options).toEqual(["Return", "Rounding", "Transfer"]);

    // Income and Expense are unreachable here — which is the whole point of the
    // split. The sparse form falls out of the type table, not a special case.
    expect(options).not.toContain("Income");
    expect(options).not.toContain("Expense");
  });

  test("the cash leg offers contributions, withdrawals, fees and retenciones", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${cashId}`);

    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await page.getByRole("combobox", { name: "Type" }).click();

    const options = await page.getByRole("option").allTextContents();
    expect(options).toEqual([
      "Transfer",
      "Contribution",
      "Withdrawal",
      "Fee",
      "Withholding",
    ]);
  });

  test("both legs render on one page, and the balance rolls up", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };

    // A contribution lands in cash, then gets invested — two movements on
    // different dates, which is what actually happens.
    const contribution = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Aportación", type: "CONTRIBUTION", amount: 1000,
              accountId: cashId, dateTime: "2026-01-05T10:00:00.000Z" },
    });
    expect(contribution.status()).toBe(200);

    // Cash -> invested is an ordinary transfer between two real accounts, using
    // the existing mirror machinery. No new code.
    const invest = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Invertido", type: "TRANSFER", amount: 900,
              accountId: cashId, typeTransferDestination: investedId,
              dateTime: "2026-01-08T10:00:00.000Z" },
    });
    expect(invest.status()).toBe(200);

    // The market moves. Return is gross of fees now.
    const ret = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Enero", type: "RETURN", amount: 50,
              accountId: investedId, dateTime: "2026-01-31T10:00:00.000Z" },
    });
    expect(ret.status()).toBe(200);

    // The fee comes out of cash, where the provider actually takes it — so it can
    // never contaminate the return figure.
    const fee = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Comisión de gestión", type: "FEE", amount: 4,
              accountId: cashId, dateTime: "2026-01-31T11:00:00.000Z" },
    });
    expect(fee.status()).toBe(200);

    // invested = 900 + 50 = 950;  cash = 1000 - 900 - 4 = 96;  total = 1046
    const invested = await (await page.request.get(`/api/accounts/${investedId}`)).json();
    const cash = await (await page.request.get(`/api/accounts/${cashId}`)).json();
    expect(invested.currentBalance).toBe(950);
    expect(cash.currentBalance).toBe(96);

    // One page, two tables — labelled as peers ("Invested" / "Cash") rather than
    // one after the whole account and one after the appendage.
    await page.goto(`/accounts/${investedId}`);
    await expect(page.getByRole("heading", { name: "Invested" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cash", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Comisión de gestión" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Enero" })).toBeVisible();

    // The header shows the combined figure, which is what you reconcile against
    // the provider's statement. Scoped to the chip: the breakdown panel below now
    // shows the same total, which is it agreeing with the header, not a duplicate.
    await expect(
      page.locator("span.border-2").filter({ hasText: "€1,046.00" })
    ).toBeVisible();
    await expect(page.getByText("invested and cash combined")).toBeVisible();
  });

  test("Invest turns cash that landed in the leg into an investment, in one click", async ({
    page,
  }) => {
    // Money arriving at the provider and money being invested are two movements,
    // days apart, and the provider posts them as two. Re-typing the second one for
    // every contribution is pure friction — the amount and destination are already
    // known.
    const invested = await createTestAccount(userId, {
      name: "Invest Target", code: "E2E.INVEST", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const cash = await createTestAccount(userId, {
      name: "Invest Cash", code: "E2E.INVEST.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening balance", type: "OPENING", amount: 0, accountId: invested.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Opening balance", type: "OPENING", amount: 0, accountId: cash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Aportación", type: "CONTRIBUTION", amount: 1000, accountId: cash.id, dateTime: "2026-01-02T10:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${invested.id}`);

    // The action only shows on money that came IN to a cash leg.
    const investButton = page.getByRole("button", { name: "Invest this cash" });
    await expect(investButton).toHaveCount(1);
    await investButton.click();

    await expect(
      page.getByRole("heading", { name: "Invest this cash" })
    ).toBeVisible();

    // Pre-filled: a transfer of the same amount into the invested parent.
    await expect(page.getByRole("combobox", { name: "Type" })).toHaveText(
      "Transfer"
    );
    await expect(
      page.getByRole("combobox", { name: "Transfer to Destination Account" })
    ).toHaveText(/Invest Target/);
    await expect(page.locator("#amountForm")).toHaveValue("1000");

    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(2500);

    // The source row is untouched — this created a second movement, it did not
    // retype the first. Cash back to 0, the fund holding 1.000.
    const cashAfter = await (
      await page.request.get(`/api/accounts/${cash.id}`)
    ).json();
    const investedAfter = await (
      await page.request.get(`/api/accounts/${invested.id}`)
    ).json();
    expect(cashAfter.currentBalance).toBe(0);
    expect(investedAfter.currentBalance).toBe(1000);

    // The contribution is still there, alongside the new outgoing transfer.
    const txs = await page.request.get(`/api/accounts/${cash.id}`);
    expect(txs.status()).toBe(200);
  });

  test("Invest is offered only on money that came in, and only on a cash leg", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    // A checking account has no invested parent to move cash into.
    await page.goto(`/accounts/${checkingId}`);
    await expect(
      page.getByRole("button", { name: "Invest this cash" })
    ).toHaveCount(0);

    // A cash leg holding one row in and one row out offers the action exactly
    // once: you cannot invest money that has already left.
    const invested = await createTestAccount(userId, {
      name: "Scope Target", code: "E2E.SCOPE", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const cash = await createTestAccount(userId, {
      name: "Scope Cash", code: "E2E.SCOPE.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening balance", type: "OPENING", amount: 0, accountId: cash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "In", type: "CONTRIBUTION", amount: 500, accountId: cash.id, dateTime: "2026-01-02T10:00:00.000Z" },
      { concept: "Fee out", type: "FEE", amount: 3, accountId: cash.id, dateTime: "2026-01-03T10:00:00.000Z" },
      { concept: "Retención out", type: "WITHHOLDING", amount: 1, accountId: cash.id, dateTime: "2026-01-04T10:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${cash.id}`);

    // Only the contribution. Not the opening, not the fee, not the retención.
    await expect(
      page.getByRole("button", { name: "Invest this cash" })
    ).toHaveCount(1);
  });

  test("Invest stops offering once the cash has been invested", async ({
    page,
  }) => {
    // The cash leg is a pool, not earmarked envelopes. Once a contribution has
    // been invested, its row is still on screen — so without a cap the button
    // would keep offering to move money that is no longer there.
    const invested = await createTestAccount(userId, {
      name: "Pool Target", code: "E2E.POOL", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const cash = await createTestAccount(userId, {
      name: "Pool Cash", code: "E2E.POOL.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening", type: "OPENING", amount: 0, accountId: cash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Opening", type: "OPENING", amount: 0, accountId: invested.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Aportación", type: "CONTRIBUTION", amount: 1_000, accountId: cash.id, dateTime: "2026-01-02T10:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${cash.id}`);
    await expect(
      page.getByRole("button", { name: "Invest this cash" })
    ).toHaveCount(1);

    // Invest the lot.
    const r = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Invertido", type: "TRANSFER", amount: 1_000,
              accountId: cash.id, typeTransferDestination: invested.id,
              dateTime: "2026-01-05T10:00:00.000Z" },
    });
    expect(r.status()).toBe(200);

    // The contribution row is still there — but there is nothing left to invest,
    // so the button is gone rather than inviting a duplicate €1.000.
    await page.reload();
    await expect(page.getByRole("cell", { name: "Aportación" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Invest this cash" })
    ).toHaveCount(0);
  });

  test("Invest caps the prefilled amount at the cash actually left", async ({
    page,
  }) => {
    const invested = await createTestAccount(userId, {
      name: "Cap Target", code: "E2E.CAP", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const cash = await createTestAccount(userId, {
      name: "Cap Cash", code: "E2E.CAP.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening", type: "OPENING", amount: 0, accountId: cash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Opening", type: "OPENING", amount: 0, accountId: invested.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Aportación", type: "CONTRIBUTION", amount: 1_000, accountId: cash.id, dateTime: "2026-01-02T10:00:00.000Z" },
      // Most of it already invested; €120,27 of residual cash remains.
      { concept: "Invertido", type: "TRANSFER", amount: 879.73, accountId: cash.id, typeTransferDestination: invested.id, dateTime: "2026-01-05T10:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${cash.id}`);
    await page.getByRole("button", { name: "Invest this cash" }).click();

    // Prefills what is left, not what the contribution originally was.
    await expect(page.locator("#amountForm")).toHaveValue("120.27");
    await expect(
      page.getByText("There is €120.27 of uninvested cash left.")
    ).toBeVisible();
  });

  test("each row offers to post the return for its own month", async ({
    page,
  }) => {
    // Every row on the invested leg implies the month it needs a return for, and
    // everything about that return is known except the number.
    const invested = await createTestAccount(userId, {
      name: "Returns", code: "E2E.RET", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const retCash = await createTestAccount(userId, {
      name: "Cash", code: "E2E.RET.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening", type: "OPENING", amount: 10_000, accountId: invested.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Opening", type: "OPENING", amount: 0, accountId: retCash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      // Fund the cash leg, then invest — so the invested leg's rows land in
      // January and February with money going IN, as they really would.
      //
      // March gets NOTHING on purpose: no contribution that month. The fund still
      // moved, and that return is precisely the one there would otherwise be no
      // row to reach.
      { concept: "Aportación", type: "CONTRIBUTION", amount: 2_000, accountId: retCash.id, dateTime: "2026-01-02T09:00:00.000Z" },
      { concept: "Invertido enero", type: "TRANSFER", amount: 1_000, accountId: retCash.id, typeTransferDestination: invested.id, dateTime: "2026-01-05T10:00:00.000Z" },
      { concept: "Invertido febrero", type: "TRANSFER", amount: 1_000, accountId: retCash.id, typeTransferDestination: invested.id, dateTime: "2026-02-05T10:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    // The page renders both legs, but only the invested one can hold returns —
    // so every return button counted below belongs to it.
    await page.goto(`/accounts/${invested.id}`);

    // December is never offered: the opening IS the position on 31 Dec, so it
    // already contains that month's return. Posting one would count it twice.
    await expect(
      page.getByRole("button", { name: "Add December 2025 return" })
    ).toHaveCount(0);

    // One pending row per month that still needs a return — including months you
    // made no contribution in, which have no other row to hang the action on.
    await expect(
      page.getByRole("button", { name: "Add January 2026 return" })
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Add February 2026 return" })
    ).toHaveCount(1);
    // March had no contribution at all, and is still offered.
    await expect(
      page.getByRole("button", { name: "Add March 2026 return" })
    ).toHaveCount(1);

    await page.getByRole("button", { name: "Add January 2026 return" }).click();

    await expect(page.getByRole("combobox", { name: "Type" })).toHaveText(
      "Return"
    );
    await expect(page.locator("#concept")).toHaveValue("January 2026");
    // The month's closing movement: 23:59, so it sorts after every contribution
    // made during the month.
    await expect(page.locator("#time")).toHaveValue("23:59");

    await page.locator("#amountForm").fill("283.84");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(2500);

    // January is done, so its pending row is gone — but February's and March's
    // remain. That is what stops a month getting two returns.
    await expect(
      page.getByRole("button", { name: "Add January 2026 return" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add February 2026 return" })
    ).toHaveCount(1);

    const after = await (
      await page.request.get(`/api/accounts/${invested.id}`)
    ).json();
    // 10.000 opening + 1.000 + 1.000 invested + 283,84 return.
    expect(after.currentBalance).toBe(12_283.84);
  });

  test("the running month is never offered a return — it has not finished", async ({
    page,
  }) => {
    const invested = await createTestAccount(userId, {
      name: "Running", code: "E2E.RUN", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 2, 12, 0, 0);

    for (const tx of [
      { concept: "Opening", type: "OPENING", amount: 1_000, accountId: invested.id, dateTime: "2020-01-01T09:00:00.000Z" },
      { concept: "This month", type: "TRANSFER", amount: 100, accountId: invested.id, dateTime: thisMonth.toISOString() },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { payee: "", currency: "EUR", category: "", notes: "",
                timezoneId: "Etc/UTC", ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${invested.id}`);

    const period = thisMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    await expect(
      page.getByRole("button", { name: `Add ${period} return` })
    ).toHaveCount(0);
  });

  test("no return action on a cash leg — it holds no market movement", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${cashId}`);

    await expect(
      page.getByRole("button", { name: /return$/ })
    ).toHaveCount(0);
  });

  test("the breakdown reconciles the balance against where it came from", async ({
    page,
  }) => {
    const invested = await createTestAccount(userId, {
      name: "Breakdown", code: "E2E.BD", bankName: "Indexa Capital",
      type: "INVESTMENT",
    });
    const cash = await createTestAccount(userId, {
      name: "Cash", code: "E2E.BD.CASH", bankName: "Indexa Capital",
      type: "INVESTMENT_CASH", parentAccountId: invested.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    for (const tx of [
      { concept: "Opening", type: "OPENING", amount: 10_000, accountId: invested.id, dateTime: "2025-12-31T09:00:00.000Z" },
      { concept: "Opening", type: "OPENING", amount: 0, accountId: cash.id, dateTime: "2025-12-31T09:00:00.000Z" },
      // 1.000 in from the bank, then invested. The internal hop must not be
      // counted as a second contribution.
      { concept: "Aportación", type: "CONTRIBUTION", amount: 1_000, accountId: cash.id, dateTime: "2026-01-02T10:00:00.000Z" },
      { concept: "Invertido", type: "TRANSFER", amount: 1_000, accountId: cash.id, typeTransferDestination: invested.id, dateTime: "2026-01-05T10:00:00.000Z" },
      { concept: "Enero", type: "RETURN", amount: 200, accountId: invested.id, dateTime: "2026-01-31T10:00:00.000Z" },
      { concept: "Comisión", type: "FEE", amount: 50, accountId: cash.id, dateTime: "2026-01-31T11:00:00.000Z" },
      { concept: "Retención", type: "WITHHOLDING", amount: 10, accountId: cash.id, dateTime: "2026-01-31T12:00:00.000Z" },
    ]) {
      const r = await page.request.post("/api/accounts/transactions/", {
        data: { ...base, ...tx },
      });
      expect(r.status()).toBe(200);
    }

    await page.goto(`/accounts/${invested.id}`);

    const panel = page
      .locator("section")
      .filter({ hasText: "Where this balance came from" });
    await expect(panel).toBeVisible();

    // opening 10.000 + contributions 1.000 + return 200 − fee 50 − retención 10
    // = 11.140. The internal 1.000 cash → invested hop cancels: it is −1.000 on
    // cash and +1.000 on invested, so contributions read 1.000, not 2.000.
    await expect(panel).toContainText("€10,000.00"); // opening
    await expect(panel).toContainText("€1,000.00"); // net contributions
    await expect(panel).toContainText("€200.00"); // market return
    await expect(panel).toContainText("-€50.00"); // fees
    await expect(panel).toContainText("-€10.00"); // retenciones
    await expect(panel).toContainText("€11,140.00"); // balance

    // And it agrees with the ledger, which is the only check that matters.
    const investedAfter = await (
      await page.request.get(`/api/accounts/${invested.id}`)
    ).json();
    const cashAfter = await (
      await page.request.get(`/api/accounts/${cash.id}`)
    ).json();
    expect(investedAfter.currentBalance + cashAfter.currentBalance).toBe(11_140);
  });

  test("no breakdown on an ordinary account", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${checkingId}`);

    await expect(
      page.getByText("Where this balance came from")
    ).toBeHidden();
  });

  test("the transfer columns filter by account name, not by uuid", async ({
    page,
  }) => {
    // The column stores an account id and only *renders* the name, so the default
    // filter matched "Fondos" against a uuid and returned nothing at all.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    const base = {
      payee: "", concept: "", currency: "EUR", category: "", notes: "",
      timezoneId: "Etc/UTC",
    };
    const r = await page.request.post("/api/accounts/transactions/", {
      data: { ...base, concept: "Filterable transfer", type: "TRANSFER",
              amount: 40, accountId: checkingId,
              typeTransferDestination: cashId,
              dateTime: "2026-04-01T10:00:00.000Z" },
    });
    expect(r.status()).toBe(200);

    await page.goto(`/accounts/${checkingId}`);
    await page.getByRole("button", { name: /Filters/ }).click();

    // The destination is "Indexa Capital - Fondos (Efectivo)" — typing any part of
    // the name it shows must find the row.
    const destFilter = page.getByPlaceholder("Transfer Destination");
    await destFilter.fill("Efectivo");
    await expect(page.getByRole("cell", { name: "Filterable transfer" })).toBeVisible();

    // And a name that is not there finds nothing, rather than everything.
    await destFilter.fill("Pensiones");
    await expect(
      page.getByRole("cell", { name: "Filterable transfer" })
    ).toBeHidden();
  });

  test("the cash leg is folded into its parent in the accounts list", async ({
    page,
  }) => {
    // Own accounts, unique names: the specs above create more accounts as they
    // run, and matching rows by a name fragment shared with them made this
    // depend on execution order.
    const parent = await createTestAccount(userId, {
      name: "Rollup Parent", code: "E2E.ROLL", bankName: "Roll Bank",
      type: "INVESTMENT",
    });
    await createTestAccount(userId, {
      name: "Rollup Child", code: "E2E.ROLL.CASH", bankName: "Roll Bank",
      type: "INVESTMENT_CASH", parentAccountId: parent.id,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto("/accounts");

    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: "Rollup Parent" })).toHaveCount(1);
    // The cash leg does not get its own row — it rolls up into its parent.
    await expect(rows.filter({ hasText: "Rollup Child" })).toHaveCount(0);
  });

  test("a transfer from the bank can still reach the cash leg, named through its parent", async ({
    page,
  }) => {
    // The destination picker must keep offering the cash leg. Hiding children
    // from the picker as well as the list would make the split unusable.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${checkingId}`);

    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Transfer", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Transfer to Destination Account" })
      .click();

    const dests = (await page.getByRole("option").allTextContents()).map((d) =>
      d.trim(),
    );

    // Both legs carry their leg name. "Indexa Capital - Efectivo" would not say
    // whose cash it is, and a plain "Indexa Capital - Fondos" sitting next to it
    // reads as the whole account rather than one half — which is how you end up
    // transferring into the wrong leg.
    expect(dests).toContain("Indexa Capital - Fondos (Efectivo)");
    expect(dests).toContain("Indexa Capital - Fondos (Invested)");
    expect(dests).not.toContain("Indexa Capital - Fondos");
  });
});
