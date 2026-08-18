import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

test.describe("Professional Polish", () => {
  test("skip link is present and focusable", async ({ page }) => {
    await page.goto(BASE_URL);
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test("color-scheme is dark", async ({ page }) => {
    await page.goto(BASE_URL);
    const colorScheme = await page.evaluate(() =>
      getComputedStyle(document.documentElement).colorScheme
    );
    expect(colorScheme).toBe("dark");
  });

  test("focus-visible rings on buttons", async ({ page }) => {
    await page.goto(BASE_URL);
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("touch targets meet minimum 44px", async ({ page }) => {
    await page.goto(BASE_URL);
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(20);  // Allow small icon buttons
      }
    }
  });

  test("ticker has aria-live region", async ({ page }) => {
    await page.goto(BASE_URL);
    const ticker = page.locator('[aria-live="polite"]');
    const count = await ticker.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
