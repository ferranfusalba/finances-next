import { test, expect } from "@playwright/test";
import {
  resetTestData,
  seedVerifiedUser,
  testEmail,
  createTestAccount,
} from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("transactions");
const USER_PASSWORD = "testpassword123";

test.describe("Account Transactions", () => {
  let userId: string;
  let accountId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
    userId = user.id;
    const account = await createTestAccount(userId, {
      name: "Transaction Test Account",
      code: "E2E.TXN",
      bankName: "TXN Bank",
      defaultCurrency: "EUR",
    });
    accountId = account.id;
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("add an income transaction and verify balance increases", async ({
    page,
  }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${accountId}`);

    await expect(
      page.getByText("Transaction Test Account", { exact: true })
    ).toBeVisible();

    // Open add transaction dialog
    await page.getByRole("button", { name: "Add Transaction" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "New Transaction" })
    ).toBeVisible();

    // Fill payee - select "Add a new payee"
    await dialog.getByRole("combobox", { name: "Payee" }).click();
    await page.getByRole("option", { name: "Add a new payee" }).click();
    await dialog.getByPlaceholder("ZRH Duty Free").fill("E2E Income Payee");

    // Fill concept
    await dialog
      .getByPlaceholder(/1x Basler/)
      .fill("E2E Income Test");

    // Select type: INCOME
    await dialog.getByRole("combobox", { name: "Type*" }).click();
    await page.getByRole("option", { name: "INCOME", exact: true }).click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("100.50");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone*" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category - select "Add a new category"
    await dialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("E2E Income Category");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E test income");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    // Verify toast notification
    await expect(
      page.getByText("Transaction for E2E Income Test has been added")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("add an expense transaction", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${accountId}`);

    await page.getByRole("button", { name: "Add Transaction" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "New Transaction" })
    ).toBeVisible();

    // Fill payee
    await dialog.getByRole("combobox", { name: "Payee" }).click();
    await page.getByRole("option", { name: "Add a new payee" }).click();
    await dialog.getByPlaceholder("ZRH Duty Free").fill("E2E Expense Payee");

    // Fill concept
    await dialog
      .getByPlaceholder(/1x Basler/)
      .fill("E2E Expense Test");

    // Select type: EXPENSE
    await dialog.getByRole("combobox", { name: "Type*" }).click();
    await page.getByRole("option", { name: "EXPENSE", exact: true }).click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("50.25");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone*" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category
    await dialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("E2E Expense Category");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E test expense");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for E2E Expense Test has been added")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("add a transfer between accounts", async ({ page }) => {
    // Create a second account as transfer destination
    const destAccount = await createTestAccount(userId, {
      name: "Transfer Destination",
      code: "E2E.DEST",
      bankName: "Dest Bank",
      defaultCurrency: "EUR",
    });

    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${accountId}`);

    await page.getByRole("button", { name: "Add Transaction" }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "New Transaction" })
    ).toBeVisible();

    // Fill payee
    await dialog.getByRole("combobox", { name: "Payee" }).click();
    await page.getByRole("option", { name: "Add a new payee" }).click();
    await dialog.getByPlaceholder("ZRH Duty Free").fill("Transfer");

    // Fill concept
    await dialog
      .getByPlaceholder(/1x Basler/)
      .fill("E2E Transfer Test");

    // Select type: TRANSFER
    await dialog.getByRole("combobox", { name: "Type*" }).click();
    await page.getByRole("option", { name: "TRANSFER" }).click();

    // Select destination account
    await dialog
      .getByRole("combobox", { name: /Transfer to Destination/ })
      .click();
    await page
      .getByRole("option", { name: /Transfer Destination/ })
      .click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("25.00");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone*" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category
    await dialog.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("Transfers");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E transfer test");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for E2E Transfer Test has been added")
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to destination account and verify the mirror transaction
    await page.goto(`/accounts/${destAccount.id}`);
    await expect(
      page.getByRole("cell", { name: "E2E Transfer Test", exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });
});
