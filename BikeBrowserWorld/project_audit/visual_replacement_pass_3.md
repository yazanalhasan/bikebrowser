# Visual Replacement Pass 3

Date: 2026-05-15

## Goal

Improve mechanical readability and tactile repair feel without adding new runtime systems, new scenes, or unrelated clutter.

This pass focused on the question: can the player understand the bike by looking at it?

## Files Changed

| Area | Files |
|---|---|
| Repair stand bike states | `Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png`, `garage_repair_stand_bmx_aligning_chain.png`, `garage_repair_stand_bmx_seated_chain.png` |
| Safety bike | `Assets/Props/Bike/small_safety_check_bike.png` |
| Backups | `project_audit/asset_backups/visual_pass_3/` |
| Preview | `project_audit/pass3_bike_scaled_preview.png` |

## Drivetrain Readability Improvements

- Added subtle chain-link cues along the drivetrain path.
- Strengthened chainring and rear sprocket silhouettes with restrained warm-metal highlights.
- Added small crank and pedal highlight cues so the player can visually connect pedal motion to chain motion.
- Kept all cues low-opacity so they read at gameplay scale without becoming tutorial arrows.

## Chain State Clarity

| State | Improvement |
|---|---|
| Broken/slipped | Chain path now hangs lower and reads as visibly off-route. |
| Aligning | Chain path is closer to the sprocket and visually less chaotic. |
| Fixed/seated | Chain path resolves into a clean loop with a small motion/success cue. |

## Pedal And Wheel Performance

- Added very subtle motion-arc hints to the fixed state so the repaired bike feels capable of spinning smoothly.
- Reinforced the crank-to-pedal relationship with a small metal highlight.
- Avoided cartoon smear or exaggerated motion; the cues are intended to be visible only as physical intuition.

## Tactile Material Pass

- Added localized grease/wear near the chainring.
- Added restrained painted-frame scratch highlights.
- Preserved chunky BMX tire readability and compact frame personality from Pass 2.
- Avoided broad texture noise so the bike remains readable at SNES/GBA-style scale.

## BMX Personality

- Preserved the compact BMX frame, worn grips, visible pedals, sticker detail, and chunky tires.
- Added only tiny wear cues: no loud branding, no extreme-sports aggression.

## Preview

The scaled preview shows the current game-scale read of the three repair states plus the safety bike:

![Pass 3 scaled bike preview](/C:/Users/yazan/bikebrowser/BikeBrowserWorld/project_audit/pass3_bike_scaled_preview.png)

## Validation

Commands run:

```powershell
godot --headless --editor --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Garage/ZuzuGarage.tscn --quit-after 2
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
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

Godot still reports its known headless shutdown resource warning, but all commands exited successfully.

## Remaining Rough Edges

- The drivetrain cues are hand-painted onto generated sprites. They are effective for the vertical slice, but final production art should ideally be authored as clean layered sprite source.
- Wheel spokes remain slightly generated-looking at full resolution, though they read acceptably at gameplay scale.
- A future animation pass could add true chain/crank motion, but this pass intentionally stayed within static sprite refinement.

