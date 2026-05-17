# Bike Readability Report

Date: 2026-05-15

## Summary

The bikes now read more like tactile objects and less like prototype markers. The repair stand is the clearest improvement: the player can see a broken chain state, an in-progress alignment state, and a finished seated-chain state.

## Repair Stand BMX

| Readability Target | Current Result |
|---|---|
| Chain problem | Implemented. Slipped chain has a visible hanging lower loop. |
| Sprocket/crank | Implemented. Crank and chainring are readable at garage scale. |
| Pedals | Implemented. Pedal silhouette and worn texture are visible. |
| Wheel silhouette | Improved. Chunky BMX tires and rims read clearly. |
| Success state | Implemented. Seated chain plus glint creates payoff. |

## Chain Progression

| State | Visual Meaning | Notes |
|---|---|---|
| `slipped_chain` | Something is wrong; chain hangs off path. | Best read comes from the loose chain loop near the lower rear drivetrain. |
| `aligning_chain` | The chain is being guided back into position. | Reads as less broken and more controlled. |
| `seated_chain` | Chain is healthy and aligned. | Glint and cleaner chain path provide success feedback. |

## Safety Check Bike

| Element | Status |
|---|---|
| Frame | Clear compact BMX shape with green painted-metal identity. |
| Brakes | Front brake and cables are visible; overlay focuses attention gently. |
| Tires | Tread and chunky silhouette are readable. |
| Chain | Chain/crank area reads well enough for the first safety interaction. |
| Handlebar | Strong silhouette with grip detail. |

## Overlay Behavior

- Brake, tire, and chain highlights now use softer opacity.
- Pulse timing was slowed to avoid debug-marker energy.
- Overlay textures match the refined bike dimensions.

## Material Identity

| Material | Current Read |
|---|---|
| Rubber | Improved through darker tread and contact-heavy tire shape. |
| Painted metal | Improved through warm highlights on bike frames. |
| Chain/sprocket | Improved through clearer linework and muted metal tones. |
| Grips/saddle | Improved through warmer worn texture. |

## Remaining Issues

1. Wheel spokes still have some generated-image softness. They are acceptable for the current slice, but a hand-authored final sprite would improve polish.
2. The repair state transition should be manually checked in Godot because the three source crops are not identical widths.
3. The chain repair interaction would benefit later from a tiny animated chain segment or crank spin, but this pass intentionally avoided adding systems.

## Manual Playtest Checklist

- Start in the neighborhood and walk to Mrs. Ramirez.
- Press `E` at the safety bike and confirm each highlight feels warm, small, and readable.
- Accept Mr. Chen's repair quest.
- Enter the garage and inspect the repair bike before pressing `E`.
- Step through all repair states and watch for sprite popping, scale drift, or glint misplacement.
- Confirm the final seated-chain state feels visually satisfying.

