import { type Page, expect } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  // Wait for redirect to home page after successful login
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await expect(page.getByText("Finances Home")).toBeVisible();
}
