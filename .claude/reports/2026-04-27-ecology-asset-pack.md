# Ecology Asset Pack — 2026-04-27

Verdict: `[static-only-fix]` (placeholders are visual; runtime testing
applies only when scenes start consuming the assets, which is a later
dispatch).

## Files created (count + paths)

26 new files total.

22 PNG assets (all 128x128, transparent background, alpha verified):

```
public/assets/ecology/plants/
  creosote.png  saguaro.png  mesquite.png  prickly_pear.png
  barrel_cactus.png  jojoba.png  agave.png  yucca.png
  desert_lavender.png  ephedra.png
public/assets/ecology/animals/
  javelina.png  rabbit.png  kangaroo_rat.png  coyote.png
  roadrunner.png  quail.png  gila_monster.png  hawk.png
public/assets/ecology/terrain/
  sand.png  dry_wash.png  rock.png  desert_ground.png
```

Supporting files:

- `public/assets/ecology/manifest.json` — data manifest (every PNG referenced)
- `public/assets/ecology/ATTRIBUTION.md` — license and authorship record
- `src/renderer/game/systems/ecology/ecologyAssetManifest.js` — Phaser loader module
- `scripts/generate-ecology-assets.js` — generation script (committed for reproducibility)
- `scripts/verify-ecology-assets.js` — verification script

## Generation approach used

Locally generated. SVG strings authored in `scripts/generate-ecology-assets.js`,
rasterized to 128x128 PNGs (compression level 9, alpha preserved) via
`sharp` (already a devDependency — no new packages added). Each asset
is a single recognizable silhouette in a flat-color desert palette.

Why SVG-then-sharp rather than canvas: `sharp` was already installed,
SVG gave clean vector silhouettes without needing the `canvas` native
build, and the script remains the source-of-truth for placeholder
shapes if the pack ever needs regeneration.

## Sources for any non-generated assets

None. Every asset is project-owned, generated locally. No third-party
images were used.

## License summary

All 22 assets: project-owned (BikeBrowser, MIT-aligned). No external
licenses to honor; no GPL / CC-BY-SA / noncommercial assets present.

## Placeholder count vs. real-art count

22 placeholders / 0 real art. Every asset is a placeholder pending
real art.

## Asset keys added to the loader

Module: `src/renderer/game/systems/ecology/ecologyAssetManifest.js`

Exports:

- `ECOLOGY_ASSET_KEYS` — frozen `{ plants, animals, terrain }` map of
  logical names to Phaser texture keys, e.g. `ECOLOGY_ASSET_KEYS.plants.creosote === 'ecology.plant.creosote'`.
- `ECOLOGY_ASSET_PATHS` — frozen reverse map (texture key -> public-relative path).
- `preloadEcologyAssets(scene)` — idempotent; loads every asset via
  `scene.load.image()`, skipping any texture that's already present.
- `getEcologyTextureKey(category, name)` — convenience lookup.
- `ECOLOGY_ASSET_COUNT` — sanity-check constant (22).

Texture key naming convention: `ecology.<plant|animal|terrain>.<name>`.

Per dispatch hard rule: the loader is wired but **no scene has been
modified** to call `preloadEcologyAssets`. Scene integration is
deferred to a later Phase 4 dispatch (after the EcologyEntity layer
exists).

## Build status

`npm run build` -> PASS (22.11s, 886 modules transformed). Module
import sanity check passed: count=22, sample keys resolve, sample
paths resolve.

Verification (`scripts/verify-ecology-assets.js`): 22/22 entries, all
files exist, all 128x128, all have alpha channel, manifest.json parses.

## Assets recommended for replacement with better art in a future dispatch

All 22. Specifically prioritized for upgrade once art bandwidth opens:

- `terrain/sand.png` and `terrain/desert_ground.png` — should be tileable
  (they are flagged `tiled: true` in manifest.json), but the current
  speckle pattern is not seamlessly tileable; a future asset should be
  a true seamless tile or include 4x4 tile variants.
- `terrain/rock.png` — currently a single boulder shape; would benefit
  from 2-3 boulder variants for visual variety.
- `animals/hawk.png` — flight pose at 128x128 leaves wing tips close to
  the bounds; consider commissioning at 192x96 if the EcologyEntity
  layer supports non-square sprites.
- `plants/saguaro.png` — saguaros are visually iconic and tall; a future
  dispatch should consider offering a taller variant (128x192 or 96x192)
  for hero placement.

## Halt-and-surface points hit

None. All 22 assets generated successfully on first pass.

Pre-flight notes:

- `sharp` was already in `devDependencies` (^0.34.5). No package install
  was needed.
- No pre-staged ecology assets existed under `public/` or `src/`.
- Asset path convention chosen: `public/assets/ecology/` (matches the
  project's `public/<category>/...` convention used by `public/audio`,
  `public/game`, `public/layouts`).
- `data/ecology.js` does not export `FLORA` / `FAUNA` tables (it exports
  `PLANT_ECOLOGY`, `PREDATOR_CHAINS`, `TIME_BEHAVIOR`, `BIOMES`). This
  is **not** a halt-and-surface — the dispatch's required filename list
  is the authoritative spec, and `manifest.json` was made consistent
  with `PLANT_ECOLOGY` / `PREDATOR_CHAINS` for the species that overlap.
- Species in the dispatch list that are **not** in `PLANT_ECOLOGY`:
  `agave`, `yucca`, `desert_lavender`, `ephedra`. Their manifest
  entries use generic biome tags only. If `data/ecology.js` is later
  extended with these species, the manifest tags should be updated to
  match.
- Species in `data/ecology.js` that are **not** in the dispatch asset
  list: `palo_verde`, `juniper`, `pinyon` (plants), `elk` (animal). No
  art was generated for these — flagged for a future dispatch if those
  species need visual representation.
