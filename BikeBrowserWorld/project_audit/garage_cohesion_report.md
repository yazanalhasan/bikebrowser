# Garage Cohesion Report

Generated: 2026-05-15

## Goal

Make Zuzu's garage feel like the emotional center of the game: warm, tactile, mechanically inspiring, and clearly handmade rather than debug-like.

## What Changed

The visible garage art now leans on cohesive PNG and derived background assets instead of mixed SVG/polygon scaffolding. The repair stand has become the visual hero object, with slipped, aligning, and repaired chain states staged in place.

## Visual Direction

The garage is now closer to the intended warm Sonoran BMX workshop:

- Dusk-plum wall/floor palette remains visible through the derived background plate.
- Workbench clutter is now made from specific tool sprites instead of text labels and primitive shapes.
- The repair zone is clearer because the complete BMX repair sprite carries the chain-repair story.
- Floor storytelling is handled by an oil-stain sprite rather than hard-edged grease polygons.

## Repair Readability

The chain repair object communicates the core idea visually:

- A full bike is mounted on the stand.
- The chain state is represented by authored bike sprites, not separate floating chain/wheel props.
- Aligned and seated states are available for future state transitions.

Recommended next step: connect quest progress to the visible repair sprite state:

1. Mission start: show slipped-chain BMX.
2. Inspect/align step: show aligning-chain BMX.
3. Completion: show seated-chain BMX with glint and reward feedback.

## Environmental Storytelling

Added or emphasized:

- Derailleur and cassette on/near the workbench.
- Chain lube, multi-tool, hex keys, tire levers, and chain breaker.
- Parts bin near the workshop zone.
- Oil stain near the stand.
- Patch kit staging near the tire repair area.

These details support the fantasy that someone actually repairs, learns, and experiments here.

## Lighting And Atmosphere

The pass avoids darkening the garage. It keeps readability high and uses warm light as focus:

- Workbench light for craft detail.
- Repair stand light for the current quest object.
- Ceiling light and string lights for cozy ambient warmth.
- Removed visible old SVG glow and polygon spills that felt like overlays.

## Performance Notes

This pass uses lightweight Sprite2D nodes and existing PNG textures. No heavy shaders, new frameworks, large particle systems, or expensive realtime lighting hacks were added.

## Web Export Notes

The added assets are standard PNG textures referenced directly by the scene. They should remain compatible with Godot Web export and iframe embedding. The only caution is texture memory growth as more prop families are added; future polish should atlas garage props once the visual set stabilizes.

## Validation Notes

Runtime smoke passed with:

- 18 missions loaded.
- Quest validation: 0 errors, 0 warnings.
- RuntimeValidator: 0 errors, 1 warning.
- Garage scene headless load: passed.

The broader vertical slice test still fails reward-intent assertions for `chain_repair` and `flat_tire_repair`. That is intentionally left untouched because this pass was scoped away from QuestRegistry, RewardBridge, and interaction-system changes.

Godot reported a resource leak warning on headless exit, which appears unrelated to this visual-only pass.

## Remaining Ugly Areas

- Hidden primitive nodes still exist as rollback scaffolding.
- The garage background plate is still a composite/derived asset, not final handcrafted room art.
- Some NPC placement in the garage may need an art-director pass so factory friends feel intentionally staged rather than lined up.
- The tire repair minigame remains visibly less polished than the garage shell.
- Reward popup staging has not yet been visually upgraded.

## Recommended Next Garage Polish Target

Wire repair quest state to the staged bike sprites and add a tiny success sequence:

- Swap slipped -> aligning -> seated chain sprite.
- Brief warm glint at chain.
- Soft wheel-spin animation or 2-frame shimmer.
- Reward popup with garage-warm color and a small mechanical sound.
