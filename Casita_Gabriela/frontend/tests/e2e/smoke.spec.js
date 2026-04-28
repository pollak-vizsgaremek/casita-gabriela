import { test, expect } from "@playwright/test";

test("Login page shows auth form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Jelszó")).toBeVisible();
  await expect(page.getByRole("button", { name: "Belépés" })).toBeVisible();
});

test("Registration page shows required legal consents", async ({ page }) => {
  await page.goto("/registration");
  await expect(page.getByText("Regisztráció").first()).toBeVisible();
  await expect(page.getByText("Elfogadom az ÁSZF-et")).toBeVisible();
  await expect(page.getByText("Elfogadom az Adatkezelési tájékoztatót")).toBeVisible();
});

test("About page is reachable", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "Rólunk" })).toBeVisible();
  await expect(page.getByText("Kik vagyunk?")).toBeVisible();
});

test("Unknown route renders 404 page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText("Az oldal nem található")).toBeVisible();
  await expect(page.getByRole("link", { name: "Vissza a főoldalra" })).toBeVisible();
});

test("Forgot password page shows email input and submit button", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByPlaceholder("Email cím")).toBeVisible();
  await expect(page.getByRole("button", { name: "Email küldése" })).toBeVisible();
});

test("Reset password without token shows error message", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByText("Érvénytelen vagy hiányzó token.")).toBeVisible();
});
