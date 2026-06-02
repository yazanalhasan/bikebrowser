# Pre-Phase-1 Baseline Audit

Categorization of the pre-existing uncommitted rebuild WIP that was
committed as the baseline (`0523c7e` "baseline: pending Act-1 art + scene
WIP"). Confirms every committed file is intentional project work — no build
output, cache, temp, screenshots, or junk entered the baseline.

## Inventory (30 files: 5 modified + 25 new)

| Path | Category | Likely purpose | safe_to_commit | needs_review | generated | uncertain |
|---|---|---|---|---|---|---|
| `src/game/phaser/scenes/NeighborhoodScene.js` | scene code | layout refactor: positions from `neighborhood.layout.json` | ✅ | — | no | no |
| `src/game/phaser/systems/AssetRegistry.js` | asset pipeline | register new final art keys | ✅ | — | no | no |
| `src/game/data/act1/act1AssetManifest.js` | asset pipeline/data | manifest entries for new art | ✅ | — | no | no |
| `src/game/art/final/act1/map_gate.png` | art asset (final) | updated map-gate art | ✅ | — | no | no |
| `…/source/aseprite/act1/prop_clarity/map_gate.svg` | art source | map-gate source | ✅ | — | no | no |
| `…/final/act1/environment_desert_road_system.png` | art asset | environment art | ✅ | — | no | no |
| `…/final/act1/environment_ecology_patch.png` | art asset | environment art | ✅ | — | no | no |
| `…/final/act1/environment_sonoran_mountain_vista.png` | art asset | environment art | ✅ | — | no | no |
| `…/final/act1/environment_vegetation_cluster.png` | art asset | environment art | ✅ | — | no | no |
| `…/final/act1/prop_replacement_bridge_debris.png` | art asset | prop art | ✅ | — | no | no |
| `…/final/act1/prop_replacement_chemistry_bench.png` | art asset | prop art | ✅ | — | no | no |
| `…/final/act1/prop_replacement_garage_workbench.png` | art asset | prop art | ✅ | — | no | no |
| `…/final/act1/prop_replacement_material_table.png` | art asset | prop art | ✅ | — | no | no |
| `…/final/act1/ui_map_frame.png` | UI asset | UI frame | ✅ | — | no | no |
| `…/final/act1/ui_npc_cue_{heart,star,wrench}.png` | UI asset | NPC cue icons | ✅ | — | no | no |
| `…/source/aseprite/act1/prop_clarity/environment_*.svg` (4) | art source | environment sources | ✅ | — | no | no |
| `src/game/art/generated/act1_concepts/.gitkeep` | placeholder | keep empty concepts dir | ✅ | — | no | no |

## Categories present
- **gameplay/scene code:** 1 (NeighborhoodScene.js — the layout refactor).
- **asset pipeline:** 2 (AssetRegistry.js, act1AssetManifest.js).
- **art assets (final PNG):** ~13. **art source (SVG):** ~5. **UI assets:** 4.
- **placeholder:** 1 (.gitkeep).
- **build output / cache / temp / screenshots / generated junk:** **0** —
  none entered the baseline (build/, test-results/, playtest_captures/ were
  excluded; only `src/game` was staged).

## Verdict
All committed files are **clearly intentional project work** (an Act-1
layout refactor + an art/UI pass). The baseline is clean and correctly
scoped. The one behavioral side-effect — the neighbor moving 398→420 closer
to the bike — exposed (did not cause) the test fragility; see
`acceptance_regression_analysis.md`. Nothing in the baseline required
exclusion or further review. Tag `baseline_pre_phase1` is safe to anchor
here (via the acceptance-green commit `84a3766`).
