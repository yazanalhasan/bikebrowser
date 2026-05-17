# Repair Theater Report

Generated: 2026-05-15

## Emotional Target

The garage should communicate:

> This is where meaningful repair happens.

The Pass 2 work shifts the garage from "visually improved" toward "emotionally staged" by giving the repair bike stronger visual gravity.

## Staging Summary

The garage now has a clearer triangle:

1. Workbench: tools, parts, and learning.
2. Repair stand: the current physical problem.
3. Open floor: Zuzu's path through the room.

The repair stand has the warmest active focus, while the workbench remains a supporting storytelling area.

## Drivetrain Readability

The drivetrain is emphasized through:

- Scale increase on the full repair BMX.
- Warm light focused near the chain/crank area.
- Subtle chain focus glow.
- Small glint on the chain path.
- Grease/scuff detail underneath the repair zone.

These are intentionally quiet. The drivetrain should feel important because the room composition respects it, not because the game is shouting at the player.

## Repair Progression Readiness

The scene is ready for a future repair-state performance:

- Slipped chain state is visible.
- Aligning chain state is staged but hidden.
- Seated chain state is staged but hidden.
- Success glint is staged but hidden.

Recommended future sequence:

1. Start: show slipped-chain bike with focus glow.
2. Inspect/align: swap to aligning-chain bike; move glint slightly along chain path.
3. Complete: swap to seated-chain bike; brief wheel-spin or glint; settle into calm repaired state.

## Lighting Composition

The repair zone is now the brightest emotional focus:

- Repair light is warmer and stronger.
- Workbench light is slightly reduced so it no longer competes.
- Ceiling light remains soft and readable.
- String lights and dust motes keep the garage cozy rather than theatrical.

## Workshop Identity

The garage reads as a BMX repair space through:

- Complete bike-on-stand silhouette.
- Drivetrain-focused staging.
- Tool clusters around the workbench.
- Wear, grease, and scuff details.
- Cozy poster/rug/string-light personality already present from earlier passes.

## Performance And Web Notes

The pass adds two small Sprite2D assets and reuses existing lightweight ambient flicker. No heavy shaders, new systems, large atlases, particle storms, or runtime framework changes were introduced.

## What Still Needs Human Visual Review

- Confirm that the repair bike scale feels right relative to Zuzu and NPCs.
- Confirm the drivetrain glow is visible but not "gamey."
- Confirm the workbench still feels warm after its light reduction.
- Confirm open floor space still feels calm and navigable.

## Next Best Polish Target

Wire the staged repair states to the chain repair mission in a separate gameplay/visual-integration pass:

- Slipped -> aligning -> seated sprite swap.
- Small calm success glint.
- Optional wheel-spin frame or very short tween.
- Reward popup timing after the seated-chain state is visible.

