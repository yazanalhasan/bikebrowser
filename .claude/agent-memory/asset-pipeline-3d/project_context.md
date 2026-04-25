---
name: Asset pipeline scope and contract
description: What this agent owns, the manifest contract established in cycle 1, and path layout decisions downstream agents depend on
type: project
---

Cycle 1 (2026-04-25) established the full asset pipeline contract for the R3F game module.

**Owned paths:**
- `src/renderer/game3d/assets/` — schema + hooks
- `public/game3d-assets/` — served static assets

**Manifest contract (`asset-manifest.schema.json`):**
- `screen_id` (required string), `models[]`, `textures[]`, `audio[]`, `preload[]`
- `additionalProperties: true` at root and item level — downstream agents extend freely
- All `path` fields are absolute from public root (`/game3d-assets/...`)

**Hook contract (`useScreenAssets(manifest)`):**
- Returns `{ models: { id → gltf }, ready: boolean }`
- Preloads via `useGLTF.preload()`, unloads via `useGLTF.clear()` on unmount
- Model-count must be stable per component instance (React hooks rules) — remount via key prop if count changes
- Strict-mode double-mount safe: cache survives the synthetic unmount

**Public directory layout:**
```
public/game3d-assets/
  models/      (.gitkeep)
  textures/    (.gitkeep)
  audio/       (.gitkeep)
  manifests/   (proof-of-life.manifest.json)
```

**KTX2:** `useKTX2` exports cleanly from @react-three/drei v9.122 — wired in cycle 1 schema (textures[]), implementation deferred to cycle 2.

**Why:** world-grid-author and location-builder need a stable contract to write manifests and adopt the hook. Permissive schema prevents schema-keeper failures as the game grows.

**How to apply:** When extending the pipeline, preserve `additionalProperties: true` and absolute `/game3d-assets/` paths. Do not reduce required fields in the schema — only add optional ones.
