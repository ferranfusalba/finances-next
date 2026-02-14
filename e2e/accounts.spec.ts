import { test, expect } from "@playwright/test";
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
    await page.getByPlaceholder("Checking").fill("Checking");

    // Select country (combobox)
    await page.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: /Spain/ }).click();

    // Select currency (combobox)
    await page.getByRole("combobox", { name: "Currency" }).click();
    await page.getByRole("option", { name: /EUR/ }).click();

    // Submit
    await page.getByRole("button", { name: "Add" }).click();

    // Should redirect to the new account's detail page
    await expect(page).toHaveURL(/\/accounts\//, { timeout: 10_000 });
    await expect(
      page.getByText("E2E Test Checking", { exact: true })
    ).toBeVisible();
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
    await page.getByRole("button").filter({ has: page.locator("svg") }).first().click();

    // Confirm deletion in the dialog
    await expect(
      page.getByRole("heading", { name: "Delete Account" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirm" }).click();

    // Should redirect to accounts list
    await expect(page).toHaveURL(/\/accounts/, { timeout: 10_000 });
  });
});
