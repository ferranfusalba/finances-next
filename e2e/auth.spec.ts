import { test, expect } from "@playwright/test";
import {
  resetTestData,
  seedVerifiedUser,
  testEmail,
  directlyVerifyEmail,
} from "./helpers/db";
import { loginAs } from "./helpers/auth";

const USER_EMAIL = testEmail("auth");
const USER_PASSWORD = "testpassword123";

test.describe("Authentication", () => {
  test.beforeAll(async () => {
    await resetTestData();
    await seedVerifiedUser(USER_EMAIL, USER_PASSWORD);
  });

  test.afterAll(async () => {
    await resetTestData();
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    await expect(page.getByText("Finances Home")).toBeVisible();
    // Email appears in multiple places; check a specific server session line
    await expect(
      page.getByText(`serverSession.user.email: ${USER_EMAIL}`)
    ).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(USER_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials!")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("register creates a new user", async ({ page }) => {
    const registerEmail = testEmail("auth-register");

    await page.goto("/auth/register");
    await page.getByLabel("Name").fill("E2E Register User");
    await page.getByLabel("Email").fill(registerEmail);
    await page.getByLabel("Password").fill("newuserpass123");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByText("Confirmation email sent!")).toBeVisible({
      timeout: 10_000,
    });

    // Verify the user can log in after manual email verification
    await directlyVerifyEmail(registerEmail);

    await loginAs(page, registerEmail, "newuserpass123");
    await expect(page.getByText("Finances Home")).toBeVisible();
  });

  test("logout shows unauthenticated state", async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD);

    // Click the avatar to open user dropdown menu
    await page.locator("nav").getByText("E", { exact: true }).click();
    // Wait for the dropdown menu to appear
    await expect(page.getByRole("menu")).toBeVisible();
    // Click the "Log out" button inside the dropdown
    await page.getByRole("button", { name: "Log out" }).click();

    // signOut clears session and redirects; wait for page to update
    await page.waitForURL("**", { timeout: 10_000 });
    // Verify no longer showing authenticated user info in nav
    await expect(
      page.getByText(`E2E Test User - ${USER_EMAIL}`)
    ).not.toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user accessing /accounts is redirected to login", async ({
    page,
  }) => {
    await page.goto("/accounts");

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
