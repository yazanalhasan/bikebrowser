# Act 1 Production Art Batch Implementation

Date: 2026-05-27

## Scope

This pass created the first runtime-safe authored art batch for `/game-rebuild` Act 1. The batch is intentionally sparse and readable; it is not AI-generated runtime art and it does not replace the future human art-director paintover pass.

## Pipeline Used

1. Authored controlled vector silhouettes in `tools/generate-act1-production-assets.js`.
2. Rasterized PNG runtime assets with `sharp`.
3. Converted source PNGs into `.aseprite` files using `C:\Program Files\Aseprite\Aseprite.exe`.
4. Stored runtime PNGs under `src/game/art/final/act1/`.
5. Stored editable sources under `src/game/art/source/aseprite/act1/`.
6. Loaded final assets through `AssetRegistry` before placeholder texture generation.
7. Kept placeholder fallback generation intact.

## Runtime Assets Created

| Asset | Runtime PNG | Aseprite Source | Runtime Use |
|---|---|---|---|
| Zuzu | `src/game/art/final/act1/zuzu.png` | `src/game/art/source/aseprite/act1/zuzu.aseprite` | player sprite |
| Mr. Chen | `src/game/art/final/act1/npc_garage_mentor.png` | `src/game/art/source/aseprite/act1/npc_garage_mentor.aseprite` | garage mentor |
| Mrs. Ramirez | `src/game/art/final/act1/npc_neighbor.png` | `src/game/art/source/aseprite/act1/npc_neighbor.aseprite` | neighbor / Spanish role |
| Auntie Mariam | `src/game/art/final/act1/npc_arabic_mentor.png` | `src/game/art/source/aseprite/act1/npc_arabic_mentor.aseprite` | Arabic mentor / family role |
| Garage workbench | `src/game/art/final/act1/garage_workbench.png` | `src/game/art/source/aseprite/act1/garage_workbench.aseprite` | garage heart landmark |
| UTM rig | `src/game/art/final/act1/utm_rig.png` | `src/game/art/source/aseprite/act1/utm_rig.aseprite` | material testing rig |
| Material samples | `src/game/art/final/act1/material_samples.png` | `src/game/art/source/aseprite/act1/material_samples.aseprite` | materials table/trader function |
| Broken bridge | `src/game/art/final/act1/bridge_broken.png` | `src/game/art/source/aseprite/act1/bridge_broken.aseprite` | before state |
| Repaired bridge | `src/game/art/final/act1/bridge_repaired.png` | `src/game/art/source/aseprite/act1/bridge_repaired.aseprite` | repaired state |
| Notebook UI | `src/game/art/final/act1/notebook_ui.png` | `src/game/art/source/aseprite/act1/notebook_ui.aseprite` | field-journal art reference |
| Ecology tokens | `src/game/art/final/act1/ecology_tokens.png` | `src/game/art/source/aseprite/act1/ecology_tokens.aseprite` | ecology patch identity |
| Chemistry station | `src/game/art/final/act1/chemistry_station.png` | `src/game/art/source/aseprite/act1/chemistry_station.aseprite` | chemistry station identity |
| HUD frame | `src/game/art/final/act1/hud_frame.png` | `src/game/art/source/aseprite/act1/hud_frame.aseprite` | future normal-HUD frame |
| Map gate | `src/game/art/final/act1/map_gate.png` | `src/game/art/source/aseprite/act1/map_gate.aseprite` | wider-map gate |

## AssetRegistry Changes

- `act1AssetManifest.js` now declares runtime URLs and `final_ready` status for the first batch.
- `AssetRegistry.loadAct1FinalAssets(scene)` loads final assets during `PreloadScene.preload()`.
- `createPlaceholderTextures(scene)` remains as fallback and does not overwrite loaded final assets.
- `window.__GAME__.getAssetRegistryState()` now reports all required Act 1 assets as final-ready for this batch.
- Smoke tests now assert:
  - required final count equals required asset count
  - `missingFinal` is empty
  - `generatedRuntimeArt` remains false

## Scene Integration

- Zuzu uses the authored player sprite.
- Mr. Chen, Mrs. Ramirez, and Auntie Mariam use distinct authored NPC sprites.
- Garage/workbench uses the authored landmark sprite.
- Materials table uses authored material sample sprite.
- Broken bridge and repaired bridge use separate authored sprites and swap at runtime based on bridge state.
- Opening staging was adjusted so the first prompt points toward Mr. Chen.

## Validation

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Results:

- Build passed.
- Full Act 1/audio/visual Playwright suite passed: 13/13.
- Follow-up smoke/visual/polish suite passed: 7/7.
- CUDA visual runtime analysis passed with 0 findings across 8 captures.

## Remaining Gaps

- This is a production-preview art batch, not the final art-director paintover.
- Walk/bike animation frames are still needed.
- Trader needs a distinct character sprite if kept as a person rather than a materials-table role.
- UTM needs visual deformation states.
- Chemistry needs visible mix/dry/transformation states.
- Ecology needs stronger shade/water/habitat staging.
- Bridge climax needs stronger timing, audio, and NPC acknowledgement.
