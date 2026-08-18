import { defineConfig } from '@playwright/test'
import { devices } from '@playwright/test'

export default defineConfig({
  reporter: 'list',
  retries: 0,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  maxFailures: 10,
  timeout: 30_000,
  workers: 1,
  testDir: './tests/e2e',
  /* Run web-first tests in Chromium only — E2E suite contains
     PWA/service-worker assertions that don't hold in Firefox,
     WebKit, or mobile Playwright contexts. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  expect: { timeout: 5_000 },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  // Enable service workers in Chromium headless by default.
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'allow',
  },
})
