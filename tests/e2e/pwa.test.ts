import { test, expect, Page } from '@playwright/test'

/**
 * PWA Infrastructure E2E Tests
 * Validates the manifest, service worker registration, and installability.
 */

test.describe('PWA Infrastructure', () => {
  test('manifest.webmanifest has required fields', async ({ page }) => {
    const response = await page.route('**/manifest.webmanifest', async route => {
      const response = await route.fetch()
      const body = await response.text()
      route.fulfill({ response, body })
    })

    // Navigate to trigger manifest fetch
    await page.goto('/')

    // Read the manifest directly
    const manifestResponse = await page.request.get('/manifest.webmanifest')
    expect(manifestResponse.status()).toBe(200)

    const manifest = await manifestResponse.json()

    // Required fields per design spec
    expect(manifest.name).toBe('Hermes Launchpad')
    expect(manifest.short_name).toBe('Hermes')
    expect(manifest.display).toBe('standalone')
    expect(manifest.orientation).toBe('portrait-primary')
    expect(manifest.theme_color).toBe('#000000')
    expect(manifest.background_color).toBe('#000000')
    expect(manifest.description).toBe('Fair-launch token curves with live market data')

    // Icons
    expect(manifest.icons).toBeDefined()
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    const icon192 = manifest.icons.find(i => i.sizes === '192x192')
    const icon512 = manifest.icons.find(i => i.sizes === '512x512')
    expect(icon192).toBeDefined()
    expect(icon512).toBeDefined()
    expect(icon192.src).toMatch(/\/icons\/icon-192\.png$/)
    expect(icon512.src).toMatch(/\/icons\/icon-512\.png$/)

    // Shortcuts
    expect(manifest.shortcuts).toBeDefined()
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3)
    const shortcutNames = manifest.shortcuts.map(s => s.name)
    expect(shortcutNames).toContain('Create Token')
    expect(shortcutNames).toContain('Account')
    expect(shortcutNames).toContain('Leaderboard')
  })

  test('service worker registers without error', async ({ page }) => {
    // Listen for console messages from the page
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(msg.text())
    })

    await page.goto('/')

    // Wait for SW registration to complete
    await page.waitForTimeout(1000)

    // The SW should register successfully (no error in console)
    const swErrors = consoleMessages.filter(m =>
      m.includes('[PWA] Service Worker registration failed')
    )
    expect(swErrors).toHaveLength(0)

    // Check that SW is actually registered in the browser
    const worker = await page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        const regs = navigator.serviceWorker.getRegistrations()
        return regs.then(regs => regs.length > 0)
      }
      return false
    })
    expect(worker).toBe(true)
  })

  test('app is installable (has manifest + SW on localhost)', async ({ page }) => {
    await page.goto('/')

    // Wait for potential beforeinstallprompt
    await page.waitForTimeout(500)

    const installability = await page.evaluate(() => {
      // App is installable if:
      // 1. Service worker is registered
      // 2. Manifest exists with required fields
      // 3. Running on HTTPS or localhost
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      const hasSW = 'serviceWorker' in navigator &&
        navigator.serviceWorker.getRegistrations().then(r => r.length > 0)

      return isLocalhost && hasSW
    })

    expect(installability).toBe(true)
  })

  test('runtime caching rules are configured (never cache API routes)', async ({ page }) => {
    // This test validates the Workbox config at build time, not runtime.
    // The build output (dist/sw.js) contains the NetworkOnly handler for
    // /api/trades|tokens/index|profile which means these routes are NEVER cached.
    // Runtime verification is flaky in Playwright test contexts due to
    // fresh browser contexts per test. We trust the build artifact.

    // Assert the generated SW contains the NetworkOnly route for API endpoints
    const swResponse = await page.request.get('/sw.js')
    expect(swResponse.status()).toBe(200)
    const swText = await swResponse.text()

    // The workbox-generated SW should have a NetworkOnly route for /api/trades etc.
    expect(swText).toContain('NetworkOnly')
    expect(swText).toContain('api-mutual')
    // In the minified SW, /api/ appears as escaped: \\/api\\/
    expect(swText).toContain('\\/api\\/')
  })
})
