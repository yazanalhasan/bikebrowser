# Mechanical Readability Report

Date: 2026-05-15

## Summary

The repair interaction now teaches more through the object itself. The player can see the chain path, the chainring/rear sprocket relationship, and the difference between broken, aligning, and fixed states without relying on text.

## What The Player Should Read

| Question | Current Visual Answer |
|---|---|
| What does the chain connect? | Rear sprocket, chainring, crank, and pedal are visually tied together. |
| What slipped? | In the broken state, the lower chain path visibly droops off-route. |
| What changes during repair? | The chain path tightens and moves closer to the correct loop. |
| What means success? | The fixed state has a clean chain path and subtle motion/success cues. |

## Drivetrain Components

| Component | Readability |
|---|---|
| Chain path | Improved with small low-opacity link marks. |
| Chainring | Improved with warm-metal ring highlight and tooth cues. |
| Rear sprocket | Improved with small warm-metal ring highlight. |
| Crank | Improved with a clear connection from chainring to pedal. |
| Pedals | Improved with a restrained outline highlight. |
| Wheels | Still generated-soft at full size, but readable at current garage scale. |

## Repair State Assessment

### State 1: Broken

The lower chain visibly hangs below the expected drivetrain line. This should read as wrong even before the player presses anything.

### State 2: Aligning

The chain is less chaotic and closer to the sprocket line. This creates a mid-state that reads as progress rather than a duplicate of the broken state.

### State 3: Fixed

The chain becomes a cleaner loop. The subtle arc cues imply the wheel and crank can move again, creating the strongest physical payoff of the three states.

## Tactile Feedback

- Existing `ChainHotspot` glint behavior continues to focus attention on the drivetrain.
- Existing repair-state sprite swaps now have stronger mechanical contrast.
- Small material highlights and grease detail give the drivetrain a touchable, worked-on feeling.

## Educational Design Check

The repair teaches visually through:

- proximity of chain to chainring
- relationship between crank and pedal
- contrast between sagging and seated chain
- success implied by a smooth loop and slight motion cue

It avoids:

- arrows
- text labels on the mechanism
- giant tutorial overlays
- noisy mechanical realism

## Manual Playtest Checklist

1. Enter the garage after accepting Mr. Chen's quest.
2. Before pressing `E`, check whether the slipped chain reads as wrong.
3. Press `E` through each repair step and watch the chain path.
4. Confirm the aligning state feels like progress.
5. Confirm the final state feels smooth and satisfying.
6. Watch for any distracting visual pop between state sprites.

## Remaining Unclear Areas

- The wheel-spoke treatment is acceptable at game scale but not final-art quality.
- The drivetrain is now readable, but a future layered animation pass would make chain motion even clearer.
- No new UI was added, so any remaining confusion should be solved through future sprite/animation refinement, not tutorial text.

