# Reusable Graphics Promotion Report

Date: 2026-05-27

## Promotion Order

The promotion pass followed the requested priority:

1. Characters
2. Bridge and notebook assets
3. Garage assets
4. Ecology and chemistry assets

Generated AI art was not used as runtime-final art. The promoted assets came from previous BikeBrowser/BikeBrowserWorld folders and were copied or composited through `tools/promote-reusable-act1-assets.js` into the Act 1 final/source art folders.

## Runtime-Final Outputs

| Priority | Runtime asset | Reused source | Notes |
| --- | --- | --- | --- |
| Characters | `src/game/art/final/act1/zuzu.png` | `BikeBrowserWorld/Assets/Characters/Zuzu/RuntimeHD/Zuzu_idle_96.png` | Promoted from stronger existing Zuzu art. Walk/repair sheets are archived as source references. |
| Characters | `src/game/art/final/act1/npc_garage_mentor.png` | `BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_idle.png` | Replaces generic mentor placeholder with a readable Mr. Chen sprite. |
| Characters | `src/game/art/final/act1/npc_neighbor.png` | `BikeBrowserWorld/Assets/Characters/MrsRamirez/MrsRamirez_idle.png` | Replaces generic neighbor placeholder with Mrs. Ramirez art. |
| Characters | `src/game/art/final/act1/npc_arabic_mentor.png` | `BikeBrowserWorld/Assets/Characters/DrMaya/DrMaya_idle/sheet-transparent.png` | Style-matched provisional visual stand-in for Auntie Mariam. A custom culturally reviewed sprite is still recommended. |
| Bridge/notebook | `src/game/art/final/act1/bridge_broken.png` | Dry wash terrain plus DryWash bridge props | Creates clearer broken crossing staging. |
| Bridge/notebook | `src/game/art/final/act1/bridge_repaired.png` | Dry wash terrain plus tested bridge segment/supports | Creates stronger before/after bridge payoff. |
| Bridge/notebook | `src/game/art/final/act1/notebook_ui.png` | BridgeNotebook paper, truss states, load-path arrows, clipboard | Promoted as a field-journal reference/runtime asset. The notebook DOM/canvas layout still uses its own child-facing rendering. |
| Garage | `src/game/art/final/act1/garage_workbench.png` | Garage wall, string lights, pegboard, poster, workbench, toolbox | Replaces plain garage placeholder with a warmer workshop cluster. |
| Ecology/chemistry | `src/game/art/final/act1/ecology_tokens.png` | Public ecology plant and dry-wash terrain assets | Groups Sonoran plant cues into one readable ecology cluster. |
| Ecology/chemistry | `src/game/art/final/act1/chemistry_station.png` | Rubber station, drying tray, beaker, goggles | Replaces abstract chemistry station with a more tactile bench prop. |

## Aseprite/Source Outputs

Each promoted runtime PNG has a matching source PNG and `.aseprite` file under:

- `src/game/art/source/aseprite/act1/`

Additional reusable source sheets were archived under:

- `src/game/art/source/aseprite/act1/reused_sources/`

Those sheets include Zuzu walk/repair, Mrs. Ramirez talk/cheer, Mr. Chen talk/repair, Auntie Mariam style reference, and bridge notebook family cards.

## Integration Status

The promoted assets keep the existing AssetRegistry path:

- `src/game/data/act1/act1AssetManifest.js`
- `src/game/phaser/systems/AssetRegistry.js`
- `src/game/phaser/scenes/PreloadScene.js`
- `src/game/phaser/scenes/NeighborhoodScene.js`

No scene logic was changed for this promotion pass. Runtime keys remain stable, and placeholder fallbacks remain available through the registry.

## Validation

Commands run after promotion:

- `npm run build` - passed
- `npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js` - 14 passed
- `py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete` - 8 images analyzed, 0 findings

The latest capture set is:

- `playtest_captures/game_rebuild_act1_complete/`

## Remaining Gaps

- Auntie Mariam still needs a custom culturally reviewed final sprite. The promoted DrMaya-derived sprite is only a style-matched provisional stand-in.
- The notebook runtime surface is still primarily drawn by the existing field-journal UI rather than fully skinning around `notebook_ui.png`.
- Some older character sheets remain useful but unassigned until Act 1 adds or clarifies additional NPC roles.
- Bike-specific repair art remains outside this promotion pass and still needs separate visual-truth review before it should be considered production-final.

## Recommendation

Next promotion pass should focus on replacing the remaining abstract tool/rig symbols:

1. UTM rig
2. Material samples
3. HUD/map frames
4. Any bike repair close-up sprites that still read as placeholder or mechanically ambiguous
