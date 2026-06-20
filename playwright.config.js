// Playwright config for BikeBrowser E2E smoke tests.
//
// Runs against a DEDICATED BikeBrowser Vite dev server on port 5219. We do NOT
// reuse an existing server: the default Vite port (5173) is frequently occupied
// by other local apps (e.g. a Dockerized chatbot), and reusing it silently ran
// the BikeBrowser tests against the wrong app. reuseExistingServer:false +
// strictPort guarantees the suite always tests BikeBrowser.
//
// See tests/README.md for usage.

import { defineConfig, devices } from 'playwright/test';

const E2E_PORT = process.env.BIKEBROWSER_E2E_PORT || '5219';
const E2E_URL = `http://localhost:${E2E_PORT}`;

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
    baseURL: E2E_URL,
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
    command: `npm run dev:react -- --port ${E2E_PORT} --strictPort`,
    url: E2E_URL,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
