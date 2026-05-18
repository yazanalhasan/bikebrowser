# Frontend / Backend / Runtime Topology

Date: 2026-05-17
Scope: Electron startup, React shell, iframe/Godot export loading, telemetry, validation, export versioning, OpenClaw integration, report-only notification behavior.

## Current Runtime Map

```text
Electron main
  -> React/Vite renderer
      -> /play
          -> legacy Phaser GameContainer
      -> /godot/BikeBrowserWorld/index.html
          -> static Godot web export
      -> old/general BikeBrowser routes
          -> videos, project builder, shopping, spelling, safe search

BikeBrowserWorld Godot project
  -> authoritative authored repair slice
  -> direct native/headless validation
  -> exported to public/godot/BikeBrowserWorld

Telemetry/reporting
  -> Godot PlaytestRigTelemetry writes playtest/telemetry/*.json only when enabled
  -> Telegram report-only governance notifier exists in the migration/reporting workspace
```

## Electron Startup

`package.json` still points Electron at `src/main/main.js`. The app architecture includes an Electron main process, preload bridge, React renderer, and optional Express API server. That is broader than the current sprint needs.

Risk:

Electron remains tied to the full legacy BikeBrowser product surface. For the Godot repair slice, Electron is a host, not the gameplay authority.

## React Shell

`src/renderer/App.jsx` registers `/play` to `GamePage`, and `GamePage` imports `../game/GameContainer`. That container is the legacy Phaser game.

Observed browser result:

- `/play` start screen: "Zuzu's Bike Adventure."
- After start: Phaser scene `ZuzuGarageScene`.
- No iframe.
- `window.__phaserGame` exists.

Risk:

The default player route is not the authored Godot slice being evaluated. This is the largest integration mismatch in the project.

## Godot Export Flow

`tools/export-godot-web.ps1` exports `BikeBrowserWorld` to `public/godot/BikeBrowserWorld/index.html` using Godot's "Web Single Threaded" preset, then writes:

- git sha,
- export timestamp,
- Godot executable path,
- project path.

Current `version.json` reports:

- `git_sha`: `620d0a123bed193bf4a2c2b30989bced40950284`
- `exported_at`: `2026-05-18T00:02:47Z`
- `project_path`: `BikeBrowserWorld`

Strength:

Export provenance exists and is concise.

Risk:

Export path works as a direct static build but is not integrated as the canonical `/play` route.

## Godot Prototype Route

There is a `GodotPrototypePage.jsx`, bridge event validator, and an e2e test for `/godot-prototype`. However, `App.jsx` does not register `/godot-prototype`.

Observed result:

- Visiting `/godot-prototype` falls back to the home page.

Risk:

This is stale integration scaffolding. It creates false confidence because a test references a route that the active app does not expose.

## Iframe Loading

Current active `/play`: no iframe.

Direct Godot export: canvas loads at `/godot/BikeBrowserWorld/index.html`.

Implication:

The intended React iframe embedding layer is not currently the authoritative path. The project should decide whether `/play` embeds the Godot export directly or whether Electron launches a Godot-native surface. For browser/Electron product coherence, `/play` should become the single Godot host path once ready.

## Telemetry Behavior

`PlaytestRigTelemetry.gd` is a sidecar autoload and no-op unless:

- `BIKEBROWSER_PLAYTEST=1`, or
- `--playtest` CLI flag is present.

It records:

- first engage time,
- verified time,
- time to verify,
- hold time,
- release count,
- state transitions.

Strength:

Telemetry is properly scoped and not always-on.

Weakness:

The only observed telemetry sample is too thin to guide design:

- one ChainRig observed,
- session duration 191 ms,
- hold time 0,
- release count 0,
- immediate verification.

This looks like a scripted or non-human path, not a playtest.

## Validation Flow

Validation is strong for structural correctness:

- RuntimeValidator: 0 errors, 1 warning.
- QuestRegistry: 18 missions, 0 errors, 0 warnings.
- Dialogue files: 25 normalized.
- Audio mappings: 7/7.
- Brake/chain/vertical-slice checks pass.

Weakness:

The validation does not yet prove human understanding, route correctness, or product launch correctness.

## Deployment Flow

Hidden fragility observed during audit:

- `5173` served a different app.
- `5174` served a different app.
- BikeBrowser required a high strict port, `5239`, to verify correctly.

This is a deployment/runtime hygiene issue. It does not mean BikeBrowser is broken, but it means local validation can easily target the wrong app and produce misleading reports.

## OpenClaw Integration

OpenClaw should remain report-only for Telegram governance. The current sprint did not enable shell execution, remote approvals, filesystem exposure, secret exposure, or environment exposure in the product. The only intended external action is one outbound completion report after the audit files are generated.

## Strongest Infrastructure

Godot-side validation and export provenance.

## Weakest Infrastructure

Authoritative route selection. The current app does not make it obvious which runtime is canonical.

## Hidden Complexity

- Phaser game shell still active.
- Godot export exists separately.
- Godot prototype route code exists but is not registered.
- General BikeBrowser app still includes many unrelated routes.
- Local dev ports may point at unrelated workspaces.

## Overengineering Risk

Adding more bridge architecture, telemetry dashboards, or multi-engine controls before choosing one canonical launch path would compound the problem. The right move is simplification around the first repair slice.

## Recommendation

Make one human-facing runtime authoritative before further content work. The best next topology target is:

`/play -> React host -> Godot BikeBrowserWorld export -> report-only bridge events -> protected reward/telemetry boundaries`

Keep Phaser available only as an explicit legacy fallback during transition, not as the default.
