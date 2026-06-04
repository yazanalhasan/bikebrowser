# BikeBrowser Playwright Inventory

Generated for Executive Brain validation hardening.

## Configuration

- Config file: `playwright.config.js`
- Test directory: `tests/e2e`
- Base URL: `http://localhost:5173`
- Web server command: `npm run dev:react`
- Workers: `1`
- Per-test timeout: `30s`
- Web server timeout: `60s`
- Existing reusable server: enabled

## Validation Tiers

| Tier | Purpose | Blocking in execution packages |
| --- | --- | --- |
| SMOKE | Build and tiny readiness checks | Yes |
| TARGETED | Explicit BikeBrowser rebuild specs | Yes |
| FULL | Broad `npx playwright test` diagnostics | Only when explicitly selected |

## Default TARGETED Commands

```powershell
npm run build
npx playwright test tests/e2e/game-rebuild.smoke.spec.js --project=chromium
npx playwright test tests/e2e/game-rebuild.act1-visual-capture.spec.js --project=chromium
```

## Known Broad-Suite Risk

`npx playwright test` currently covers legacy, rebuild, snapshot, audio, and Godot-related tests. That is useful for periodic triage, but it is too broad for a bounded Executive Brain execution package because unrelated slow or hanging suites can make a focused package look failed.

## Diagnostic Entry Point

```powershell
powershell -ExecutionPolicy Bypass -File scripts/diagnose_playwright.ps1
```

The diagnostic script writes watchdog-protected outputs under `artifacts/playwright_audit/` and classifies timeout code `124` as full-suite diagnostic failure rather than targeted validation failure.
