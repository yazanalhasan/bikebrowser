# Visual Replacement Pass 2

Date: 2026-05-15

## Goal

Polish the bike and repair visuals without changing runtime architecture. This pass focused on tactile readability, material identity, and the chain repair progression.

## Files Changed

| Area | Files |
|---|---|
| Repair bike sprites | `Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png`, `garage_repair_stand_bmx_aligning_chain.png`, `garage_repair_stand_bmx_seated_chain.png` |
| Safety bike sprites | `Assets/Props/Bike/small_safety_check_bike.png`, `small_safety_check_bike_brakes_overlay.png`, `small_safety_check_bike_tires_overlay.png`, `small_safety_check_bike_chain_overlay.png` |
| Interaction polish | `Systems/Interactions/ChainHotspot.gd`, `Systems/Interactions/SafetyCheckStation.gd` |
| Data-driven scale tuning | `Data/layouts/garage.json`, `Data/layouts/neighborhood_street.json` |

## Repair Stand Improvements

- Replaced the remaining synthetic magenta spoke/fringe artifacts with muted graphite-metal tones.
- Preserved the three-state chain progression:
  - slipped chain: loose lower chain loop reads as the problem
  - aligning chain: chain sits closer to the sprocket and visually tightens
  - seated chain: chain path resolves cleanly with a small success glint
- Added subtle repair-bike warmth modulation during interaction so the object feels alive without pulsing like debug UI.
- Made the existing repair glint move to the relevant drivetrain area for each repair state.

## Safety Bike Improvements

- Cleaned the refined safety bike sprite so the frame, brakes, tire tread, chain, crank, and handlebar silhouette read more clearly.
- Rebuilt the brake, tire, and chain overlays as soft amber-green attention guides.
- Reduced overlay opacity and pulse speed so they feel like gentle teaching focus, not collision/debug indicators.
- Adjusted data-driven scale from `0.26` to `0.13` for the larger refined bike asset.

## Grounding And Focus

- Kept existing soft shadows under bikes/NPCs/player.
- Adjusted repair bike scale from `0.38` to `0.32` in the garage layout to compensate for the larger refined sprite dimensions.
- Kept garage focus lighting subtle: no new systems, no heavy VFX, only existing glint and warm modulation.

## BMX Identity

- The refined sprites now include BMX-specific readability: compact frame geometry, chunky tires, worn grips, pedals, chainring, and small sticker/decal personality.
- Detail remains restrained so the repair interaction reads at gameplay scale.

## Validation

Commands run:

```powershell
godot --headless --editor --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Garage/ZuzuGarage.tscn --quit-after 2
```

RuntimeValidator result:

- Errors: 0
- Warnings: 1
- Quests loaded: 18
- Dialogue files: 21
- Regions: 7
- Audio mappings: 7/7

Known warning:

- Native TTS unavailable on this platform.

Godot still prints its usual headless shutdown resource warning, but all validation commands exited successfully.

## Remaining Visual Risks

- Repair bike sprite states have slightly different crop widths, so a manual in-editor playtest should confirm they do not visually pop when switching state.
- Wheel spokes are now less synthetic, but a future hand-authored sprite pass could make them cleaner.
- Garage still contains some intentionally hidden or legacy placeholder nodes. They are not visible in the current slice, but should be cleaned once the art direction is locked.

