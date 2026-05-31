# Child-Facing Walkthrough And Art-Direction Report

Date: 2026-05-27

Scope: `/game-rebuild` Act 1 experiential pass focused on what a child sees, understands, and feels.

## Summary

Act 1 now reads warmer and more intentional without adding visual clutter. The pass did not chase production art fidelity. It refined hierarchy, spacing, landmark pull, NPC readability, notebook language, feedback wording, and scene atmosphere while preserving the existing data-driven systems.

The main child-facing shift is from "debuggable systems board" toward "warm neighborhood adventure map." The bridge, garage, and notebook now carry more emotional weight, and the player has clearer visual anchors.

## Strongest Moments

- The broken bridge/dry wash remains the strongest Act 1 emotional problem.
- The garage/workbench now feels more like a warm home base instead of a generic station.
- The notebook reward loop is clearer and more child-facing: new unlocks are framed as field notes/clues.
- The wider map reveal stays restrained and curious.
- NPCs are easier to distinguish through spacing and small identity cues.
- Zuzu stands out better against road and interaction-ring colors.

## Weakest Moments Remaining

- The HUD is still heavier than ideal for a final child-facing game, especially the persistent objective box and clue panel.
- The notebook is improved, but still mostly text. It needs authored sketch/icon cards in a later art pass.
- NPCs are more readable, but still placeholders; final silhouettes should be authored in Aseprite.
- UTM/material testing communicates results, but the physical deformation could become more tactile later.
- The road still occupies a large part of the screen because the current scene layout is intentionally simple.

## Readability Improvements

Changed:

- Reduced road dominance by softening road/sidewalk/lane-marker contrast.
- Added a stronger player outline and slightly larger Zuzu scale.
- Reduced interaction halo opacity so rings do not overwhelm NPCs and objects.
- Renamed the evidence panel to `Clues so far`.
- Changed helper text to `E or Space explore` and `N field notebook`.
- Preserved clear prompts without adding new UI complexity.

## Atmosphere Improvements

Changed:

- Added a warmer garage/workbench glow.
- Added subtle dusk bands to the background.
- Added a restrained bridge/gate focal glow and path cue.
- Kept desert detail sparse and purposeful.

The scene now feels less cold and more like a quiet Sonoran neighborhood at the start of an adventure.

## Composition Improvements

Changed:

- Garage/workbench is visually grouped as the creative heart of Act 1.
- Bridge and map gate now pull the eye more strongly.
- NPCs have slightly better breathing room and clearer identity marks.
- Zuzu has better foreground presence.

The composition still uses simple placeholder geometry, but the focal hierarchy is clearer.

## Interaction Improvements

Changed:

- Notebook unlock feedback now says `New field note`.
- Bike feedback keeps the validator contract phrase `Bike check complete` while making the checked parts clear.
- Dry wash feedback now says the bridge needs proof before crossing, which is more emotionally understandable.
- UTM feedback now explicitly says evidence was added.
- Bridge repair feedback now says the path feels safe again.

These are small wording changes, but they make the systems feel more like a child-facing story of observation and trust.

## NPC Readability

Changed:

- Mr. Chen, Mrs. Ramirez, and Auntie Mariam gained small visual identity cues.
- NPC label backgrounds are softer and more legible.
- NPC ring dominance was reduced.

Remaining need:

- Final character silhouettes, colors, and posture should be authored as production sprites.
- Cultural/personality details should remain brief and human-authored.

## Notebook Findings

Changed:

- The notebook title now reads `Zuzu's Field Notebook`.
- New entries use a star marker instead of an asterisk.
- Category counts are reduced to unlocked clue categories rather than showing every empty category.
- Language is more discovery-oriented.

Remaining need:

- Add sketch-like icons/cards for production.
- Consider letting the notebook occupy a more intentional "page" layout once final UI art exists.

## UTM Findings

Current state:

- The UTM is understandable as a testing station.
- The result feedback is more explicit after this pass.

Remaining need:

- Add clearer material deformation or comparison bars in a future targeted pass.
- Avoid making it a quiz or dashboard; it should feel like "I tested this, so I know more."

## Map And Discovery Findings

Changed:

- Wider map gate has a clearer focal cue.
- The bridge-to-gate visual path is more visible.
- The map unlock feedback is still restrained.

Remaining need:

- Future map UI should feel like a discovered field map, not a menu.

## Audio/TTS Walkthrough Review

The audio/TTS substrate remains stable:

- NPC voice routing is distinct.
- TTS normalization tests still pass.
- No speech overlap storm was observed in validation.
- Audio remains system-driven rather than hardcoded into scene logic.

Remaining need:

- Final authored ambience/music assets should be added later.
- Browser Web Speech voice quality remains platform-dependent.

## Visual QA

Captured states:

- `playtest_captures/game_rebuild_child_facing_review/01_act1_start.png`
- `playtest_captures/game_rebuild_child_facing_review/02_bike_repair_notebook.png`
- `playtest_captures/game_rebuild_child_facing_review/03_bridge_discovery.png`
- `playtest_captures/game_rebuild_child_facing_review/04_material_testing.png`
- `playtest_captures/game_rebuild_child_facing_review/05_ecology_interaction.png`
- `playtest_captures/game_rebuild_child_facing_review/06_chemistry_interaction.png`
- `playtest_captures/game_rebuild_child_facing_review/07_trust_language_notebook.png`
- `playtest_captures/game_rebuild_child_facing_review/08_bridge_repaired_map_unlock.png`

CUDA visual analysis:

- Input: `playtest_captures/game_rebuild_child_facing_review`
- Images: 8
- Findings: 0
- Output: `project_audit/visual_runtime_analysis.json`

## Validation

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.act1-visual-capture.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_child_facing_review
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js
npm run test:e2e -- game-rebuild.audio.spec.js
```

Results:

- Build: passed
- Act 1 visual capture: passed
- CUDA visual QA: 8 images, 0 findings
- Act 1 smoke/complete/visual/polish tests: 7 passed
- Audio/TTS tests: 5 passed

## Files Changed

- `docs/game_rebuild/child_facing_experiential_audit.md`
- `docs/game_rebuild/child_facing_walkthrough_report.md`
- `src/game/phaser/scenes/NeighborhoodScene.js`
- `src/game/phaser/systems/Act1RuntimeSystem.js`
- `src/game/phaser/systems/AssetRegistry.js`
- `playtest_captures/game_rebuild_child_facing_review/`

Note: Audio/TTS files from the prior pass remain dirty in the working tree and were validated again, but this report focuses on the child-facing art-direction pass.

## Remaining Weaknesses

- Final production art is still needed.
- HUD should eventually have a normal-play mode and a debug/playtest mode split.
- UTM and notebook would benefit most from future hand-authored visual affordances.
- NPC identity needs actual character art.
- Ecology and chemistry still read as stations more than lived-in experiences.

## Next Recommended Phase

Do a focused production-art brief pass for the exact placeholders that now have clear roles:

1. Zuzu final sprite and movement readability.
2. Three NPC silhouettes with restrained identity cues.
3. Garage/workbench hero asset.
4. Bridge/dry-wash focal asset.
5. Notebook clue-card UI.
6. UTM material deformation feedback.

The target should remain Aseprite-authored, sparse, warm, and child-readable.
