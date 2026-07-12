import { test, expect } from "./helpers/test";
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

    // Select type: Income
    await dialog.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Income", exact: true }).click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("100.50");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category - select "Add a new category"
    await dialog.getByRole("combobox", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("E2E Income Category");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E test income");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    // Verify toast notification
    await expect(
      page.getByText("Transaction for E2E Income Payee has been added")
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

    // Select type: Expense
    await dialog.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Expense", exact: true }).click();

    // Fill amount
    await dialog.getByPlaceholder("Amount").fill("50.25");

    // Select timezone
    await dialog.getByRole("combobox", { name: "Timezone" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category
    await dialog.getByRole("combobox", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("E2E Expense Category");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E test expense");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for E2E Expense Payee has been added")
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

    // Select type: Transfer
    await dialog.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Transfer", exact: true }).click();

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
    await dialog.getByRole("combobox", { name: "Timezone" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    // Fill category
    await dialog.getByRole("combobox", { name: "Category", exact: true }).click();
    await page.getByRole("option", { name: "Add a new category" }).click();
    await dialog.getByPlaceholder("Groceries").fill("Transfers");

    // Fill notes
    await dialog.getByPlaceholder(/Invoice Ref/).fill("E2E transfer test");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for Transfer has been added")
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to destination account and verify the mirror transaction
    await page.goto(`/accounts/${destAccount.id}`);
    await expect(
      page.getByRole("cell", { name: "E2E Transfer Test", exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("edit a transaction", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);
    await page.goto(`/accounts/${accountId}`);

    // Find the row with "E2E Income Test" and click its edit button
    const row = page.getByRole("row").filter({ hasText: "E2E Income Test" });
    await row.getByRole("button", { name: "Edit transaction" }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Edit Transaction" })
    ).toBeVisible();

    // Update the concept
    const conceptInput = dialog.getByPlaceholder(/1x Basler/);
    await conceptInput.clear();
    await conceptInput.fill("E2E Income Edited");

    // Submit
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Transaction for E2E Income Payee has been updated")
    ).toBeVisible({ timeout: 10_000 });

    // Verify updated concept appears in the table
    await expect(
      page.getByRole("cell", { name: "E2E Income Edited", exact: true })
    ).toBeVisible();
  });
});

test.describe("Transfer Sync", () => {
  let userId: string;
  let originAccountId: string;
  let destAccountId: string;

  test.beforeAll(async () => {
    await resetTestData();
    const user = await seedVerifiedUser(
      testEmail("transfer-sync"),
      USER_PASSWORD
    );
    userId = user.id;
    const origin = await createTestAccount(userId, {
      name: "Origin Account",
      code: "E2E.ORIG",
      bankName: "Origin Bank",
      defaultCurrency: "EUR",
    });
    originAccountId = origin.id;
    const dest = await createTestAccount(userId, {
      name: "Dest Account",
      code: "E2E.DST",
      bankName: "Dest Bank",
      defaultCurrency: "EUR",
    });
    destAccountId = dest.id;
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("edit transfer from origin syncs mirror on destination", async ({
    page,
  }) => {
    await loginAs(page, testEmail("transfer-sync"), USER_PASSWORD);
    await page.goto(`/accounts/${originAccountId}`);

    // Create a transfer
    await page.getByRole("button", { name: "Add Transaction" }).click();
    const addDialog = page.getByRole("dialog");
    await expect(
      addDialog.getByRole("heading", { name: "New Transaction" })
    ).toBeVisible();

    await addDialog.getByRole("combobox", { name: "Payee" }).click();
    await page.getByRole("option", { name: "Add a new payee" }).click();
    await addDialog.getByPlaceholder("ZRH Duty Free").fill("Sync Transfer");

    await addDialog.getByPlaceholder(/1x Basler/).fill("Sync Test Original");

    await addDialog.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Transfer", exact: true }).click();

    await addDialog
      .getByRole("combobox", { name: /Transfer to Destination/ })
      .click();
    await page.getByRole("option", { name: /Dest Account/ }).click();

    await addDialog.getByPlaceholder("Amount").fill("50.00");

    await addDialog.getByRole("combobox", { name: "Timezone" }).click();
    await page.getByRole("option", { name: /UTC/ }).first().click();

    await addDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Transaction for Sync Transfer has been added")
    ).toBeVisible({ timeout: 10_000 });

    // Edit the transfer from origin: change concept and amount
    const originRow = page
      .getByRole("row")
      .filter({ hasText: "Sync Test Original" });
    await originRow.getByRole("button", { name: "Edit transaction" }).click();

    const editDialog = page.getByRole("dialog");
    await expect(
      editDialog.getByRole("heading", { name: "Edit Transaction" })
    ).toBeVisible();

    const conceptInput = editDialog.getByPlaceholder(/1x Basler/);
    await conceptInput.clear();
    await conceptInput.fill("Sync Test Updated");

    const amountInput = editDialog.getByPlaceholder("Amount");
    await amountInput.clear();
    await amountInput.fill("75.00");

    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Transaction for Sync Transfer has been updated")
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to destination and verify the mirror was updated
    await page.goto(`/accounts/${destAccountId}`);
    await expect(
      page.getByRole("cell", { name: "Sync Test Updated", exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("destination-side transfer has disabled edit and copy buttons", async ({
    page,
  }) => {
    await loginAs(page, testEmail("transfer-sync"), USER_PASSWORD);
    await page.goto(`/accounts/${destAccountId}`);

    // Find the mirror transfer row
    const row = page
      .getByRole("row")
      .filter({ hasText: "Sync Test Updated" });
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Edit and copy buttons should be disabled
    const editButton = row.getByRole("button", { name: "Edit transaction" });
    const copyButton = row.getByRole("button", { name: "Copy transaction" });
    await expect(editButton).toBeDisabled();
    await expect(copyButton).toBeDisabled();
  });

  test("delete transfer from origin removes mirror on destination", async ({
    page,
  }) => {
    await loginAs(page, testEmail("transfer-sync"), USER_PASSWORD);
    await page.goto(`/accounts/${originAccountId}`);

    // Find the transfer row and delete it
    const row = page
      .getByRole("row")
      .filter({ hasText: "Sync Test Updated" });
    await row.getByRole("button", { name: "Delete transaction" }).click();

    // Confirm in the delete dialog
    const deleteDialog = page.getByRole("dialog");
    await expect(
      deleteDialog.getByText(
        "This will also delete the corresponding transaction on the other account."
      )
    ).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText("Transaction deleted successfully")
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to destination and verify the mirror is gone
    await page.goto(`/accounts/${destAccountId}`);
    await expect(
      page.getByRole("cell", { name: "Sync Test Updated", exact: true })
    ).not.toBeVisible({ timeout: 10_000 });
  });
});
