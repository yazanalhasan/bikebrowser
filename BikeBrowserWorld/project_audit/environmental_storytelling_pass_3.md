# Environmental Storytelling Pass 3

Generated: 2026-05-15

## Scope

This pass focused on emotional memory, neighborhood rhythm, and landmark identity. It did not add gameplay systems, collectibles, interaction logic, region expansion, quest logic, dialogue logic, save logic, or registry changes.

Changed:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`
- `res://Regions/Garage/ZuzuGarage.tscn`
- `res://Data/layouts/neighborhood_street.json`
- `res://Data/layouts/garage.json`
- `res://Regions/Shared/SubtleAmbientLife.gd`

## Landmark Identity Improvements

Added a small `LandmarkMemoryLayer` in the neighborhood:

- `GarageHomeAnchorGlow`: reinforces the garage entrance as the warm home/workshop landmark.
- `RampMemoryArc`: ties the ramp, jump marks, chalk, and skid wear into one remembered activity zone.
- `MailboxQuietAnchor`: gives the mailbox/Ramirez side a calm, grounded identity.
- `ChenWorkshopWarmPool`: gives Mr. Chen's workshop side a separate warm repair identity.
- `RamirezPorchCalmPool`: reinforces Mrs. Ramirez's side as porch-warm and neighborly.
- `QuietRoadBreathingBand`: preserves a visual rest band through the middle of the street.

Added a small `HomeMemoryLayer` in the garage:

- `RepairHomeWarmPool`: reinforces the repair bike as the emotional/work focus.
- `BenchMemoryPool`: reinforces the workbench as the learning/tool memory area.
- `QuietFloorRestBand`: keeps the garage from becoming evenly busy and protects visual breathing room.

## Neighborhood Rhythm Changes

The layout now alternates:

- warm porch/workshop zones,
- a quiet road band,
- active ramp/chalk zone,
- calm mailbox/neighbor zone,
- warm garage destination.

The goal is that walking through the street feels like moving through recognizable pockets rather than a flat spread of details.

## Memory Anchor Improvements

Strengthened anchors:

- garage: warm threshold glow, `FIX IT` mat, worn path, workshop pool,
- ramp: chalk identity, jump marks, skid arc, curb wear,
- mailbox: name tape plus quiet grounding,
- porch: recurring warm light and calm pool,
- Mr. Chen: warm workshop-side pool,
- garage interior: repair bike pool and workbench memory pool.

These are not quests or collectibles. They are quiet spatial cues.

## Evening Atmosphere Improvements

- Warm/cool balance was reinforced through very low-alpha amber landmark pools and cool road/floor rest bands.
- The road and garage floor now keep open calm areas instead of becoming uniformly detailed.
- Garage warmth is concentrated around the repair bike, workbench, and threshold.

## Ambient Motion Tuning

`SubtleAmbientLife.gd` was tuned down:

- lower flicker amplitude,
- lower sway amplitude,
- lower flutter amplitude,
- slower speed scale,
- per-scene exported strength controls.

Neighborhood and garage now use different strength/speed values so the motion feels less synchronized and less loopy.

## BMX Culture Reinforcement

The BMX identity is now carried by spatial relationships:

- ramp wear and memory arc,
- old jump/skid marks,
- bike/fence/sticker cluster,
- repair bench to repair bike relationship,
- recurring chain/repair marks.

The tone remains neighborhood-scale rather than arena-scale.

## Screenshots

No screenshots were captured in this pass. Prior audits note that headless screenshot capture is unreliable under the dummy renderer for this project. Validation used scene loading, RuntimeValidator, JSON parsing, script checking, resource-reference scanning, and whitespace checks.

