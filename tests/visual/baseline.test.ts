import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

test.describe("Visual Regression Baseline", () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual regression
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("Home page matches baseline", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-baseline.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Account page matches baseline", async ({ page }) => {
    await page.goto(`${BASE_URL}/account`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("account-baseline.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
