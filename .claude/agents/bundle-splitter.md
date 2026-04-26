---
name: bundle-splitter
description: Splits the GamePage and Game3DPage chunks (2.97 MB / 1.95 MB per resource-auditor 2026-04-25) by adding manualChunks config to vite.config so phaser, three, @react-three/*, and rapier land in vendor chunks instead of bloating route bundles. Also fixes the wasted dynamic import of quizQuestionGenerator in MCPAIAdapter.js since the module is static-imported elsewhere anyway.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 18
---

You own the Vite production build configuration. Specifically:
- `vite.config.js` (or `.ts` / `.mjs` — read what's there)
- One follow-up edit in `src/renderer/services/MCPAIAdapter.js`

You do NOT own runtime code. Do not edit anything under `src/renderer/game/`, `src/renderer/game3d/`, `src/renderer/pages/`, or `src/renderer/components/` except the single MCPAIAdapter.js fix described below.

## Background — what's broken

Per `.claude/swarm/reports/resource-audit-2026-04-25T21-37-37.md`:

- `GamePage-CGxMBq82.js` is **1.95 MB** uncompressed (490 KB gzipped) — Phaser-heavy.
- `Game3DPage-D_SpAuUx.js` is **2.97 MB** uncompressed (1.01 MB gzipped) — three + drei + rapier all bundled into the route.
- Vite emits its 500 KB warning during `npm run build`.

Both routes are already lazy-loaded via `lazy(() => import('./pages/...'))` in `src/renderer/App.jsx`, so they don't hit cold start — but each individual chunk is 4–6× the recommended ceiling. The fix is **vendor splitting**: pull Phaser, three, drei, rapier into their own chunks so multiple routes that use the same library share one cached chunk.

Separately, the auditor flagged that `quizQuestionGenerator.js` is statically imported by 3 modules but **also** dynamically imported by `MCPAIAdapter.js` — the dynamic import is wasted because Vite static-imports it anyway via the other 3 entry points. Convert it to a static import for clarity.

## First cycle goal

### Step 1 — Determine which Vite config exists

Run:
```bash
ls vite.config.* 2>/dev/null
```

Confirm exactly one Vite config is present. Read it.

### Step 2 — Add manualChunks

Add (or extend, if `build.rollupOptions.output` already exists) a `manualChunks` configuration. Use the **function form** (not the object form) so we can pattern-match on import paths:

```js
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('phaser')) return 'vendor-phaser';
          if (id.includes('@react-three/rapier')) return 'vendor-rapier';
          if (id.includes('@react-three/drei')) return 'vendor-drei';
          if (id.includes('@react-three/fiber')) return 'vendor-r3f';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('react-router')) return 'vendor-router';
          // Default: let Rollup decide (typically lands in the calling chunk)
        }
      },
    },
  },
}
```

Order matters: drei imports three, so check drei BEFORE three (already correct above).

If the existing config uses TypeScript types, match them. Preserve any other `build` options that are already there (sourcemap, target, etc.).

### Step 3 — Fix the wasted dynamic import

In `src/renderer/services/MCPAIAdapter.js`, find the `await import('./quizQuestionGenerator…')` (or similar pattern) and convert it to a top-of-file static import. Then update the call site to use the imported binding directly instead of awaiting a module record.

Before patching, grep for `quizQuestionGenerator` across `src/renderer/` to confirm:
- It IS statically imported by at least 3 modules (auditor's claim)
- Only one place uses dynamic import (the one to fix)

If grep shows the dynamic import is the **only** importer (auditor was wrong), DO NOT make this change — leave dynamic import in place and note in the receipt.

### Step 4 — Verify

Run `npm run build` and capture stdout. Compare against the audit baseline:

| Metric | Baseline (audit) | After |
|---|---|---|
| GamePage chunk | 1 999.35 KB | should drop to <500 KB |
| Game3DPage chunk | 2 976.60 KB | should drop to <500 KB |
| New `vendor-phaser` chunk | n/a | should appear, ~1 800 KB |
| New `vendor-three` + `vendor-r3f` + `vendor-drei` + `vendor-rapier` | n/a | should appear, total ~2 700 KB |
| Build warnings about chunk size | 1+ | should drop to 0 |

If any chunk size exceeds 1 MB after splitting (other than the vendor-phaser chunk), note it as a follow-up — drei alone may need further sub-splitting in a later cycle.

If the build fails: capture the error, mark receipt status `partial`, do not commit a broken config.

## Standards

- JavaScript / no TypeScript additions. Match existing config style.
- Do NOT change Vite version, plugins, or any other config. Only `build.rollupOptions.output.manualChunks` and (if needed) the parent path additions.
- Do NOT add new top-level dependencies.
- Do NOT modify any file outside `vite.config.*` and `src/renderer/services/MCPAIAdapter.js`.

## Receipt

Write to: `.claude/swarm/receipts/bundle-splitter-<ISO timestamp>.json`

Conform to the receipt schema. Include:
- `files_changed`: vite config path + (if changed) MCPAIAdapter.js path
- `notes`: full before/after chunk-size table from `npm run build` stdout
- `next_agent_suggestions`: typically empty unless the new vendor chunks are still > 1 MB

Hard turn cap: 18.
