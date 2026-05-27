# Art Contract Truth Audit

Date: 2026-05-26

## Contract

`BikeBrowserWorld/docs/art-pipeline.md` states that production character, tile, and prop art should have `.aseprite` source files beside the authored assets and Godot should consume exported PNG/JSON runtime outputs.

## Findings

| Area | Status | Finding |
| --- | --- | --- |
| Safety bike runtime PNGs | Regression | `Assets/Props/Bike/small_safety_check_bike*.png` are flat low-detail exports while `small_safety_check_bike_pass1_backup.png` is the high-quality baseline. |
| Garage repair stand bike PNGs | Regression | `garage_repair_stand_bmx_*chain.png` are flat low-detail exports while matching `*_pass1_backup.png` files are the high-quality baseline. |
| Bike prop Aseprite sources | Missing | No `.aseprite` sources exist under `Assets/Props/Bike` or `Assets/Props/BikeRepair`. |
| Neighborhood safety bike | Surfaced | `NeighborhoodStreet.tscn` uses the low-detail safety bike runtime files directly. |
| Garage repair stand | Mixed | `SlippedChainStation.tscn` uses a handcrafted rig and `bike_repair_stand.png`, not the richer `garage_repair_stand_bmx_*` sprites. The richer sprites still need to be preserved as production source/baseline assets for the surfaced mechanic. |
| ChainRigEmbedded | Needs correctness validation | The rig is stateful and embodied, but orientation must be verified against actual bike-facing direction. |
| TireRig | Improved but mixed | Current staging uses coherent close-up props, but still needs patch/leak alignment and schema validation. |

## Classification

| Asset | Classification | Action |
| --- | --- | --- |
| `garage_repair_stand_bmx_slipped_chain_pass1_backup.png` | Quality baseline | Restore into runtime export and convert to `.aseprite` source. |
| `garage_repair_stand_bmx_aligning_chain_pass1_backup.png` | Quality baseline | Restore into runtime export and convert to `.aseprite` source. |
| `garage_repair_stand_bmx_seated_chain_pass1_backup.png` | Quality baseline | Restore into runtime export and convert to `.aseprite` source. |
| `small_safety_check_bike_pass1_backup.png` | Quality baseline | Restore into runtime base export and derive high-quality state variants. |
| Current flat bike PNGs | Regression | Replace. |
| `BikeRepair/*.png` small tool/patch sprites | Production-acceptable but source-missing | Convert to `.aseprite` source files. |
| `patch_with_glue_tube.png` | Supply object only | Keep as patch-kit/supply art; do not use as applied patch. |
| `single_tube_patch.png` | Applied patch | Use for actual patch-over-leak state. |

## Decision

Restore the richer pass-1 bike art as the player-facing baseline, create local `.aseprite` sources for surfaced Act 1 repair visuals, and add validation so future flat/prototype replacements are caught.
