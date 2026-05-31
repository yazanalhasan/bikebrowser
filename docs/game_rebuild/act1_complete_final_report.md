# Act 1 Observed vs Expected Completion Report

Date: 2026-05-27

## Verdict

`Observed != Expected` yet, but the gap is materially smaller after this pass.

Act 1 now has a first authored production-preview art layer, runtime AssetRegistry loading, distinct NPC sprites, a visible UTM deformation cue, ecology/chemistry world-state cues, child-facing HUD/notebook polish, audio/TTS replay and quiet-mode controls, and green validation.

The experience is no longer purely placeholder geometry, but it still needs human art-direction polish, richer animation, stronger bridge climax timing, and deeper sensory/audio embodiment before it can honestly be called the complete expected child-facing slice.

## What Changed In This Pass

- Added 14 hand-authored production-preview Act 1 runtime PNGs.
- Added matching `.aseprite` source files for the first art batch.
- Added `tools/generate-act1-production-assets.js` to regenerate the local authored batch.
- Updated `act1AssetManifest.js` to declare final-ready runtime URLs.
- Added `loadAct1FinalAssets(scene)` and wired it into `PreloadScene`.
- Kept placeholder fallback generation intact.
- Updated `NeighborhoodScene` to use distinct Zuzu/NPC/garage/material/bridge art.
- Added broken/repaired bridge sprite swap based on ConstructionSystem state.
- Added a small UTM deformation visual tied to latest material test results.
- Added chemistry and ecology embodied state indicators.
- Adjusted opening staging so the first prompt points to Mr. Chen.
- Surfaced `R` speech replay and `M` quiet-audio controls in normal play.
- Updated smoke/audio/visual tests for the new final-asset truth.

## Current Evidence

Screenshots:

- `playtest_captures/game_rebuild_act1_complete/01_act1_start.png`
- `playtest_captures/game_rebuild_act1_complete/04_material_testing.png`
- `playtest_captures/game_rebuild_act1_complete/08_bridge_repaired_map_unlock.png`

Validation:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Results:

- Build passed.
- Playwright passed: 14/14.
- CUDA visual runtime analysis: 8 images, 0 findings.

## Observed vs Expected

| Area | Current observed | Expected | Remaining gap |
|---|---|---|---|
| Zuzu | Authored readable sprite. | Memorable idle/walk/bike player identity. | Needs animation frames and final paintover. |
| NPCs | Three distinct authored NPC sprites plus voice profiles. | Every NPC immediately memorable. | Trader/sign roles need clearer visual treatment and final poses. |
| Garage | Authored workbench cluster plus warm staging. | Iconic kid engineering sanctuary. | Needs more tactile prop story and ambience. |
| Notebook | Field-journal layout, tabs, clue cards, star markers. | Treasured journal artifact. | Needs final card/icon art and page interaction. |
| UTM | Visual strip bends/fails/holds based on test. | Tactile philosophical center. | Needs richer material comparison and timing. |
| Bridge | Broken/repaired sprites swap and gate unlocks. | Emotional climax: "I fixed the world." | Needs transition beat, crossing choreography, audio/NPC response. |
| Ecology | Plant art plus shade/water/ethic indicators. | Living-world observation. | Needs more habitat logic visible in scene. |
| Chemistry | Station art plus mix/dry feedback. | Useful transformation loop. | Needs visible recipe stage animation. |
| HUD | Minimal trail/clue HUD plus replay/quiet hints. | Child-facing, warm, non-dashboard. | Needs final HUD frame integration and mobile review. |
| Audio | TTS, voice routing, normalization, replay/quiet controls. | Emotionally authored soundscape. | Needs final loops/cues and balance review. |

## Remaining Tensions

- The master contract originally scoped final production art out; the current observed-equals-expected directive asks for a production-quality art pass. This pass resolves the conflict by creating a first authored production-preview layer without claiming it is the final art-director pass.
- Runtime assets are Aseprite-source-backed, but the generator creates source PNGs and imports them into Aseprite rather than hand-painting in Aseprite. This is acceptable for a first local authored batch, but final production should be hand-reviewed and cleaned in Aseprite.
- The Act 1 visual capture harness uses debug hooks to set states for screenshots; it is useful for regression evidence but not a replacement for a no-debug child playtest.

## Next Required Work

1. Human art-director paintover of the 14 `.aseprite` sources.
2. Zuzu walk/bike animation frames.
3. Bridge repair transition and NPC acknowledgement.
4. UTM comparison view with clearer weak/useful/strong material timing.
5. Chemistry mix/wait/test visible state sequence.
6. Ecology shade/water/harvest-ethic staging.
7. Mobile readability capture and fixes.
8. Clean scoped commit inventory because the worktree contains unrelated Godot/art/audit files.
