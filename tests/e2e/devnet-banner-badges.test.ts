import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

test.describe("Devnet Preview Banner and Provenance Badges", () => {
  test("devnet preview banner is visible on feed pages", async ({ page }) => {
    // Home feed carries the TopNav devnet banner
    await page.goto(BASE_URL);
    const bannerText =
      "Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL.";
    await expect(page.locator(`text="${bannerText}"`)).toBeVisible();

    // /trade renders the same feed (modal-on-feed pattern)
    await page.goto(`${BASE_URL}/trade`);
    await expect(page.locator(`text="${bannerText}"`)).toBeVisible();
  });

  test("provenance badges render correctly in TokenModal for demo token", async ({ page }) => {
    await page.goto(BASE_URL);

    // Feed cards expose provenance via data-testid (TokenCard)
    await page.waitForSelector('[data-testid="provenance-demo"]', { timeout: 15000 });
    await page.locator('[data-testid="provenance-demo"]').first().click();

    // Mint status lives under the "Token Details" tab
    await page.click('button[role="tab"]:has-text("Token Details")');
    await expect(page.locator('text="Demo Mode"').first()).toBeVisible();

    await page.keyboard.press("Escape");
  });

  test("provenance badges render correctly in TokenModal for on-chain token", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.waitForSelector('[data-testid="provenance-onchain"]', { timeout: 15000 });
    await page.locator('[data-testid="provenance-onchain"]').first().click();

    await page.click('button[role="tab"]:has-text("Token Details")');
    await expect(page.locator('text="On-chain Indexed"').first()).toBeVisible();

    await page.keyboard.press("Escape");
  });

  test("provenance badges render correctly in CreateTokenModal", async ({ page }) => {
    // ?create=1 deep-link opens the create flow (BottomNav button is mobile-viewport only)
    await page.goto(`${BASE_URL}/?create=1`);
    await expect(page.locator("text=Step 1 / 3")).toBeVisible({ timeout: 10000 });

    await page.fill('input[id="ct-name"]', "Test Token");
    await page.fill('input[id="ct-ticker"]', "TEST");
    await page.click('button:has-text("Choose Mascot")');
    await page.click('button[aria-label="Choose 🚀"]');
    await page.click('button:has-text("Review")');

    // Review step shows devnet + live-curve provenance badges
    await expect(page.locator('text="devnet"').first()).toBeVisible();
    await expect(page.locator('text="live curve"').first()).toBeVisible();

    await page.keyboard.press("Escape");
  });
});
