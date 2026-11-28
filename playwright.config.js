// Playwright config for BikeBrowser E2E smoke tests.
//
// Runs against the Vite dev server in chromium, auto-started by the
// webServer block below and reused if one is already listening.
//
// PORT: not 5173. On the owner's box :5173 belongs to a different app
// (Medical AI Chatbot), and `reuseExistingServer` happily attached to it
// — every spec then timed out in `waitForGameBoot` waiting for a Phaser
// handle that app will never set. `assertBikeBrowser` in
// tests/e2e/helpers/gameBoot.js now turns that into a named failure
// instead of a timeout, but the port default keeps it from happening.
// Override with BB_E2E_PORT when 5199 is taken too.
//
// See tests/README.md for usage.

import { defineConfig, devices } from 'playwright/test';

const PORT = process.env.BB_E2E_PORT || '5199';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Game boot + runtime audit can take 10-15s on cold start.
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // --strictPort so vite fails loudly rather than drifting to a port
    // the tests are not looking at.
    command: `npm run dev:react -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
