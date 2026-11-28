// Playwright config for the PRODUCTION-BUILD acceptance tests.
//
// MUST 0.16 only happens in a minified build: the boot scene was looked
// up by class name, and the minifier renames classes, so "Continue
// Adventure" always opened the garage on the live site while every
// dev-server test passed. A green dev run is not acceptance for 0.15 or
// 0.16 — they run here, against `vite preview` of a real `npm run
// build`.
//
// VITE_E2E_HANDLE exposes window.__phaserGame in the built bundle (see
// GameContainer). It adds the handle and nothing else; the minification
// that caused the bug is unchanged.
//
//   npx playwright test --config playwright.preview.config.js
//
import { defineConfig, devices } from 'playwright/test';

const PORT = process.env.BB_PREVIEW_PORT || '5200';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  // Game boot from a cold production build is slower than dev.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'prod',
      testDir: './tests/e2e-prod',
      // hasTouch, because the 0.17 suite drives phones with
      // page.touchscreen and nothing else. A mouse click reaches
      // controls a finger cannot, which is how the lab soft-lock
      // (review MUST 1) passed every test I had.
      use: { ...devices['Desktop Chrome'], hasTouch: true },
    },
    {
      // 0.15's acceptance, re-run against the built bundle.
      name: 'prod-legacy-art',
      testDir: './tests/e2e',
      testMatch: /no-legacy-art\.smoke\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { VITE_E2E_HANDLE: 'true' },
  },
});
