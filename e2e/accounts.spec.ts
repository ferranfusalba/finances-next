import { test, expect } from "./helpers/test";
import {
  resetTestData,
  seedVerifiedUser,
  testEmail,
  createTestAccount,
} from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("accounts");
const USER_PASSWORD = "testpassword123";

test.describe("Accounts", () => {
  let userId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
    userId = user.id;
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("create a new account via the form", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    await page.goto("/accounts/new");
    await expect(
      page.getByRole("heading", { name: "New Account" })
    ).toBeVisible();

    // Fill in account form (labels aren't associated with inputs, use placeholders)
    await page.getByPlaceholder("N26", { exact: true }).fill("E2E Bank");
    await page.getByPlaceholder("Primary Space").fill("E2E Test Checking");
    await page.getByPlaceholder("N26.PS").fill("E2E.CHK");

    // These triggers are <button role="combobox">, and `combobox` is NOT a
    // name-from-content role, so they expose an empty accessible name — matching
    // them by name finds nothing. Match on the visible placeholder instead.
    const combobox = (placeholder: string) =>
      page.getByRole("combobox").filter({ hasText: placeholder });

    // Account type is a fixed enum now, not free text — select, don't type.
    await combobox("Select an account type").click();
    await page.getByRole("option", { name: "Checking", exact: true }).click();

    // Select country
    await combobox("Select a country").click();
    await page.getByRole("option", { name: /Spain/ }).click();

    // Select currency. Anchor the match: several currency labels contain "EUR"
    // as a substring, and the option label is "<CODE> - <Name> (<symbol>)".
    await combobox("Select a currency").click();
    await page.getByRole("option", { name: /^EUR - / }).click();

    // Starting balance is compulsory: it becomes the account's OPENING
    // transaction, and it cannot be recovered once the create form is gone.
    await page.locator("#openingBalance").fill("1500");

    // Starting Date is the same calendar picker the transaction form uses — not a
    // native <input type="date">, which rendered differently in every browser and
    // made the same task look like two different apps.
    await page.locator("#openingDate").click();
    const calendar = page.getByRole("dialog");
    await expect(calendar).toBeVisible();

    // By data-day, not by text: the day buttons take their accessible name from
    // aria-label ("Wednesday, July 1st, 2026"), so matching on "1" finds nothing.
    // The 1st of the current month is always in the past, so never disabled.
    const today = new Date();
    const firstOfMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;
    await calendar.locator(`td[data-day="${firstOfMonth}"] button`).click();

    await expect(page.locator("#openingDate")).not.toHaveText("Pick a date");

    // Submit
    await page.getByRole("button", { name: "Add" }).click();

    // Should redirect to the new account's detail page
    await expect(page).toHaveURL(/\/accounts\//, { timeout: 10_000 });
    await expect(
      page.getByText("E2E Test Checking", { exact: true })
    ).toBeVisible();

    // The starting balance became the opening transaction, so the account opens
    // at 1.500 rather than at zero — and there is no "no opening balance" banner.
    await expect(
      page.getByText("This account has no opening balance")
    ).toBeHidden();
    await expect(page.getByRole("cell", { name: "Opening", exact: true })).toBeVisible();
  });

  test("an account opened today accepts a transaction dated today", async ({
    page,
  }) => {
    // The opening sits at the FIRST instant of its date. It used to sit at midday,
    // which rejected a same-day transaction entered before noon — and 09:00 is the
    // transaction form's own default time, so this was the very next thing you did
    // after creating an account.
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    await page.goto("/accounts/new");
    await page.getByRole("combobox").filter({ hasText: "Select a bank" }).click();
    await page.getByRole("option", { name: /Add a new bank/ }).click();
    await page.getByLabel("New Bank").fill("Same Day Bank");
    await page.getByPlaceholder("Primary Space").fill("Same Day Account");
    await page.getByPlaceholder("N26.PS").fill("E2E.SAMEDAY");

    const combobox = (placeholder: string) =>
      page.getByRole("combobox").filter({ hasText: placeholder });
    await combobox("Select an account type").click();
    await page.getByRole("option", { name: "Checking", exact: true }).click();
    await combobox("Select a currency").click();
    await page.getByRole("option", { name: /^EUR - / }).click();

    // Starting Date defaults to today — the case that used to break.
    await page.locator("#openingBalance").fill("1000");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page).toHaveURL(/\/accounts\//, { timeout: 10_000 });

    // A transaction with the form's own defaults: today, at 09:00.
    await page.getByRole("button", { name: "Add Transaction" }).first().click();
    await expect(page.locator("#time")).toHaveValue("09:00");
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Expense", exact: true }).click();
    await page.locator("#concept").fill("Same-day coffee");
    await page.locator("#amountForm").fill("5");
    await page.getByRole("button", { name: "Save" }).click();

    // Accepted, and the balance moved. A midday opening returned 400 here.
    await expect(
      page.getByRole("cell", { name: "Same-day coffee" })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("cannot be dated before the account's opening balance")
    ).toBeHidden();
  });

  test("the bank name is picked from the banks you already use", async ({
    page,
  }) => {
    // It was free text, so a second account at the same bank was one typo away
    // from being filed under a different one — and the bank name is what groups
    // accounts in the sidebar and the overview.
    await createTestAccount(userId, {
      name: "First", code: "E2E.BANK1", bankName: "Indexa Capital",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto("/accounts/new");

    const bankPicker = page
      .getByRole("combobox")
      .filter({ hasText: "Select a bank" });
    await bankPicker.click();

    const options = await page.getByRole("option").allTextContents();
    expect(options).toContain("Indexa Capital");
    expect(options.join("|")).toContain("Add a new bank");

    // Adding a bank is still one click — you just cannot do it by accident.
    await page.getByRole("option", { name: /Add a new bank/ }).click();
    await expect(page.getByLabel("New Bank")).toBeVisible();
  });

  test("an account with no opening shows the banner, and setting one clears it", async ({
    page,
  }) => {
    // Accounts predating the compulsory opening have none. We deliberately do not
    // backfill them with a zero — their real starting balance is not something we
    // can infer — so they are prompted instead.
    const account = await createTestAccount(userId, {
      name: "Legacy Account",
      code: "E2E.LEGACY",
      bankName: "Legacy Bank",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${account.id}`);

    await expect(
      page.getByText("This account has no opening balance")
    ).toBeVisible();

    await page.getByRole("button", { name: "Set opening balance" }).click();
    await expect(
      page.getByRole("heading", { name: "Set Opening Balance" })
    ).toBeVisible();

    // The type is pre-set and locked — an opening cannot become an expense.
    const typeSelect = page.getByRole("combobox", { name: "Type" });
    await expect(typeSelect).toBeDisabled();
    await expect(typeSelect).toHaveText("Opening");

    await page.locator("#amountForm").fill("2500");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("This account has no opening balance")
    ).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole("cell", { name: "Opening", exact: true })).toBeVisible();
  });

  test("view an existing account", async ({ page }) => {
    const account = await createTestAccount(userId, {
      name: "View Test Account",
      code: "E2E.VIEW",
      bankName: "View Bank",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${account.id}`);

    await expect(
      page.getByText("View Test Account", { exact: true })
    ).toBeVisible();
    // Bank name appears in sidebar and header; use the header's span element
    await expect(page.locator("span.text-2xl")).toHaveText("View Bank");
    await expect(page.getByText("E2E.VIEW")).toBeVisible();
  });

  test("delete an account", async ({ page }) => {
    const account = await createTestAccount(userId, {
      name: "Delete Me Account",
      code: "E2E.DEL",
      bankName: "Delete Bank",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${account.id}`);

    await expect(
      page.getByText("Delete Me Account", { exact: true })
    ).toBeVisible();

    // Click the trash icon button (destructive variant) to open delete dialog
    await page.locator('button[class*="destructive"]').click();

    // Confirm deletion in the dialog
    await expect(
      page.getByRole("heading", { name: "Delete Account" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirm" }).click();

    // Should redirect to accounts list
    await expect(page).toHaveURL(/\/accounts/, { timeout: 10_000 });
  });
});
