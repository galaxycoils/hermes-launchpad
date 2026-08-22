import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4174";

test.describe("Devnet Preview Banner and Provenance Badges", () => {
  test("devnet preview banner is visible on all pages", async ({ page }) => {
    // Test on Home page
    await page.goto(BASE_URL);
    
    // Check for the devnet banner in TopNav (should be visible on all pages)
    let devnetBanner = page.locator('text="Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL."');
    await expect(devnetBanner).toBeVisible();
    
    // Also check for the "Devnet" badge in TopNav (only on Home page since only Home uses TopNav)
    let devnetBadge = page.locator('text="Devnet"').first();
    await expect(devnetBadge).toBeVisible();
    
    // Test on Trade page - should have the banner but not TopNav badge
    await page.goto(`${BASE_URL}/trade`);
    devnetBanner = page.locator('text="Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL."');
    await expect(devnetBanner).toBeVisible();
    // Trade page doesn't use TopNav, so no Devnet badge there
    
    // Test on Account page - should have the banner but not TopNav badge
    await page.goto(`${BASE_URL}/account`);
    devnetBanner = page.locator('text="Devnet preview — not mainnet. Use a Devnet wallet and faucet SOL."');
    await expect(devnetBanner).toBeVisible();
    // Account page doesn't use TopNav, so no Devnet badge there
  });

  test("provenance badges render correctly in TokenModal for demo token", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for tokens to load - look for a token card with "Demo" badge
    await page.waitForSelector('button:has-text("Demo")', { timeout: 10000 });
    
    // Click on first demo token card to open TokenModal
    const firstDemoToken = page.locator('button:has-text("Demo")').first();
    await firstDemoToken.click();
    
    // Check for provenance badges in TokenModal
    // Demo tokens should show "demo" badge
    const demoBadge = page.locator('text="demo"').first();
    await expect(demoBadge).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  test("provenance badges render correctly in TokenModal for on-chain token", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for tokens to load - look for a token card with "Live" badge
    await page.waitForSelector('button:has-text("Live")', { timeout: 10000 });
    
    // Click on first on-chain token card to open TokenModal
    const firstLiveToken = page.locator('button:has-text("Live")').first();
    await firstLiveToken.click();
    
    // Check for provenance badges in TokenModal
    // On-chain tokens should show "verified" badge
    const verifiedBadge = page.locator('text="verified"').first();
    await expect(verifiedBadge).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  test("provenance badges render correctly in CreateTokenModal", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click Launch Token button in Hero
    await page.click('button:has-text("Launch Token")');
    
    // Fill in name and ticker to enable "Choose Mascot" button
    await page.fill('input[id="ct-name"]', 'Test Token');
    await page.fill('input[id="ct-ticker"]', 'TEST');
    
    // Step through to step 2 (Choose Mascot)
    await page.click('button:has-text("Choose Mascot")');
    
    // Pick an emoji - use the one in the emoji grid (not BottomNav)
    await page.locator('.grid button:has-text("🚀")').first().click();
    
    // Step through to step 3 (Review)
    await page.click('button:has-text("Review")');
    
    // Check for provenance badges in CreateTokenModal step 3
    // Should show "devnet" and "live curve" badges
    const devnetBadge = page.locator('text="devnet"');
    const liveCurveBadge = page.locator('text="live curve"');
    
    await expect(devnetBadge).toBeVisible();
    await expect(liveCurveBadge).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
  });
});