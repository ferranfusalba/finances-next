import { test, expect } from "@playwright/test";
import {
  resetTestData,
  seedVerifiedUser,
  testEmail,
  createTestBudget,
} from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("budgets");
const USER_PASSWORD = "testpassword123";

test.describe("Budgets", () => {
  let userId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
    userId = user.id;
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("create a new budget via the form", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    await page.goto("/budgets/new");
    await expect(
      page.getByRole("heading", { name: "New Budget" })
    ).toBeVisible();

    // Fill budget form (use placeholders since labels aren't associated)
    await page.getByPlaceholder("Budget Name").fill("E2E Test Budget");
    await page.getByPlaceholder("Budget Code").fill("E2E.BDG");
    await page.getByPlaceholder("Budget Type").fill("Monthly");

    // Select currency (combobox)
    await page.getByRole("combobox", { name: "Currency" }).click();
    await page.getByRole("option", { name: /EUR/ }).click();

    // Fill initial balance
    await page.getByPlaceholder("Initial Balance").fill("500");

    // Submit
    await page.getByRole("button", { name: "Add" }).click();

    // Should redirect to the new budget's detail page
    await expect(page).toHaveURL(/\/budgets\//, { timeout: 10_000 });
    // Budget name appears in sidebar nav and header; check just the header span
    await expect(page.locator("span").filter({ hasText: "E2E Test Budget" })).toBeVisible();
  });

  test("add a transaction to a budget", async ({ page }) => {
    const budget = await createTestBudget(userId, {
      name: "Budget TXN Test",
      code: "E2E.BTXN",
      defaultCurrency: "EUR",
      initialBalance: 1000,
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/budgets/${budget.id}`);

    // Budget name appears in sidebar and header; use header span
    await expect(
      page.locator("span").filter({ hasText: "Budget TXN Test" })
    ).toBeVisible();

    // Open add transaction dialog
    await page.getByRole("button", { name: "Add Transaction" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Add Transaction" })
    ).toBeVisible();

    // Fill concept (budget uses text input, not select, for concept)
    await dialog
      .getByPlaceholder(/1x Basler/)
      .fill("E2E Budget Expense");

    // Select type: EXPENSE (budget uses Select combobox)
    await dialog.getByRole("combobox", { name: "Type*" }).click();
    await page.getByRole("option", { name: "EXPENSE" }).click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("100");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone*" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category (budget uses plain text input for category)
    await dialog
      .getByPlaceholder("Digital Subscriptions", { exact: true })
      .fill("Subscriptions");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E budget test");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for E2E Budget Expense has been added")
    ).toBeVisible({ timeout: 10_000 });

    // Verify transaction appears in the table
    await expect(page.getByText("E2E Budget Expense")).toBeVisible();
  });
});
