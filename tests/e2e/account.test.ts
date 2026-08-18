import { test, expect } from '@playwright/test';

test.describe('Account Page', () => {
  test('account page renders with 6 tabs', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /Account Settings/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Wallets/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Security/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Notifications/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /API Keys/ })).toBeVisible();
    await expect(page.locator('text=Referrals')).toBeVisible();
    await expect(page.locator('text=Danger Zone')).toBeVisible();
  });

  test('tab switching works', async ({ page }) => {
    await page.goto('/account');
    await page.getByRole('button', { name: /Security/ }).click();
    await expect(page.getByRole('heading', { name: /Two-Factor Authentication/ })).toBeVisible();
    await page.getByRole('button', { name: /API Keys/ }).click();
    await expect(page.getByRole('button', { name: /Create New Key/ })).toBeVisible();
  });
});
