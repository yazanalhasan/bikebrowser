# Bike Art Regression Fix Report

Date: 2026-05-26

## Fixed

- Restored `garage_repair_stand_bmx_slipped_chain.png` from `garage_repair_stand_bmx_slipped_chain_pass1_backup.png`.
- Restored `garage_repair_stand_bmx_aligning_chain.png` from `garage_repair_stand_bmx_aligning_chain_pass1_backup.png`.
- Restored `garage_repair_stand_bmx_seated_chain.png` from `garage_repair_stand_bmx_seated_chain_pass1_backup.png`.
- Restored `small_safety_check_bike.png` from `small_safety_check_bike_pass1_backup.png`.
- Rebuilt high-quality state variants for:
  - `small_safety_check_bike_brakes_worn.png`
  - `small_safety_check_bike_tires_flat.png`
  - `small_safety_check_bike_chain_slipped.png`
- Created `.aseprite` source files for surfaced Act 1 bike repair assets.

## Player-Facing Truth

The safety bike and repair-stand bike assets now match the richer pass-1 baseline instead of the flat low-detail regression exports. The safety-check state images remain under the same stable runtime names, so `NeighborhoodStreet.tscn` does not need reference churn.

## Remaining Art Notes

- `SlippedChainStation.tscn` still uses a live embedded rig for the actual chain interaction; that is intentional because the repair needs mechanical state changes, not only a static sprite.
- The restored repair-stand BMX PNGs are preserved as production-quality visual references and can be used in debug previews, close-ups, or future rig texture passes.
- Original hand-layered Aseprite files were not found locally; recovered sources were created from the best available PNGs.
