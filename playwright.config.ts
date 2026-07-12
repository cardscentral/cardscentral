import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the web / PWA E2E suite.
 *
 * We test the *production* web build (dist/) served under the real GitHub Pages
 * base path (/cardscentral/) so the tests exercise the exact bundle + service
 * worker users get. Playwright (not Selenium) is used because:
 *   - it auto-waits on elements (far less flaky than Selenium),
 *   - react-native-web renders `testID` as `data-testid`, which maps 1:1 to
 *     Playwright's getByTestId — so we reuse the same selectors as the Maestro
 *     native flows,
 *   - flows that rely on RN's multi-button Alert.alert() (language switch,
 *     delete confirm, clear-data) are covered natively by Maestro instead —
 *     react-native-web renders those button lists as a no-op, so on web those
 *     specs assert the reachable affordance rather than the destructive result,
 *     and
 *   - it ships its own browsers + a webServer runner (no external WebDriver).
 */

export default defineConfig({
  testDir: './e2e-web',
  fullyParallel: false, // flows share localStorage state within a file
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'http://localhost:4173/cardscentral/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Build the PWA once, then serve it at the production base path.
  webServer: {
    command: 'npm run build:web && node scripts/serve-web.js 4173',
    url: 'http://localhost:4173/cardscentral/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
