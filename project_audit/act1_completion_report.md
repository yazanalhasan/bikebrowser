# Act 1 Completion Report

Date: 2026-05-18
Workspace: `C:\dev\bikebrowser`

## Status

Act 1 is complete enough for a small external child playtest.

The canonical `/play` route is coherent, validated, and focused on warm embodied mechanical learning. The player can progress through the intended neighborhood -> repair -> bridge/materials -> regional systems -> workshop -> spacecraft clue arc.

## Completed

- Locked the critical Act 1 path around the nine surfaced quests in `QuestRegistry.ACT1_GUIDANCE_ORDER`.
- Added and validated the Act 1 regional readiness capstone.
- Preserved `/play` as the canonical Godot route and `/legacy-play` as contained fallback.
- Kept diagnostics hidden by default.
- Improved dialogue/modal gating so players cannot walk/interact through modal dialogue.
- Improved station input handling and overlap protection.
- Added objective-level HUD guidance.
- Added domain-specific station visuals and TireRig repair props.
- Improved mobile portrait camera framing using the real browser window size.
- Aligned badges/rewards with the surfaced player path.
- Created source-of-truth, gating, art, mobile, validation, and playtest reports.

## Surfaced

- Mrs. Ramirez, Mr. Chen, Ranger Nita, Dr. Maya, Old Miner Pete, and the workshop friend group.
- Safety bike, TireRig, ChainRig, BridgeReviewStation, PlantObservationStation, WaterQualityStation, CopperEvidenceStation, WorkshopBuildStation, and Act1CapstoneStation.
- Regional Travel Sketchbook and Spacecraft Clue Card as capstone reward items.

## Deferred / Gated

The loaded backend graph remains broader than the player-facing route. These are explicitly non-blocking for Act 1:

- `bridge_quest_1`-`bridge_quest_4`
- `bridge_material_test`
- `first_safety_check`
- `water_sample_observation`
- `algae_bloom_source`
- `track_the_animal`
- `mine_cart_repair`
- Shopkeeper/family/individual workshop-friend arcs unless later wired as complete loops.

## What Remains Weak

- Touch-only mobile controls need observation with a real child.
- The first safety flow is improved but still deserves close observation: the key question is whether children naturally talk to Mrs. Ramirez and then use the bike checks.
- Bridge content is intentionally condensed into `bridge_quest_5`; a future sprint can build the full bridge-material interaction loop if desired.

## Validation Status

Passed:

- 16 Godot headless/runtime/Act 1/regression scripts.
- `npm run build`
- Godot web export.
- Playwright `/play` smoke: 2/2.
- Playwright HUD/legacy smoke: 2/2.
- Browser playthrough smoke: 4/4.
- Node mechanics tests: 14/14.
- `git diff --check`
- CUDA mobile visual analysis confirmed portrait active-pixel ratio improved from 0.3089 to 0.6443.

Known non-blocking warnings:

- Godot headless cleanup warnings on exit.
- Vite chunk/module-type warnings.

## Playtest Readiness

Recommended: run a small external child playtest now.

Watch comprehension of brakes, tire repair, chain force transfer, bridge/material intuition, evidence stations, workshop synthesis, and the spacecraft clue. Use `project_audit/act1_external_playtest_packet.md`.

## Next Recommended Sprint

Run the external playtest, then fix only the comprehension failures it reveals. Do not expand Act 2 or un-gate side quests until the first-session learning path is proven with children.

