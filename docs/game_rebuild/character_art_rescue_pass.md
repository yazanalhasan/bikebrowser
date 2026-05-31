# Character Art Rescue Pass

## Executive Brain Governance

Executive Brain classified this as a medium-risk BikeBrowser coding/art integration task. BikeBrowser is controlled, while Aseprite, Godot, Meshy, and local Hunyuan are governed tools with different adapter limits. The task used Aseprite-exported production sheets for runtime art and did not promote Meshy or Hunyuan output directly into the game.

## Problem

The Act 1 runtime could still visually regress toward tiny placeholder or marker-like character reads. Even when animated sheets were present, the NPC cluster was crowded and the AssetRegistry loaded character animation sheets from a source/reused path instead of a clearly promoted runtime-final character folder.

## Actions

- Exported current Aseprite character sheets into `src/game/art/final/act1/characters`.
- Rewired AssetRegistry animation sheets to load from the runtime-final character folder.
- Increased player and NPC presentation scale.
- Restaged Mr. Chen, Mrs. Ramirez, and Auntie Mariam with more separation.
- Added subtle ground plates under NPCs so silhouettes read as characters in the scene.
- Added runtime metadata and Playwright assertions proving NPCs use Aseprite runtime sheets rather than fallback placeholder art.

## Tool Boundaries

- Aseprite: used for runtime-final character sheet export.
- Meshy: not used for runtime-final characters; external service remains governed and reference-only without approval.
- Hunyuan3D: not used for runtime-final characters; local shape workflow remains reference-only and license-gated.
- Godot: not modified in this pass; current playable target is the Phaser game rebuild.

## Validation

Run after this pass:

- `npm run test:e2e -- game-rebuild.act1-polish.spec.js`
- `npm run test:e2e -- game-rebuild.act1-visual-capture.spec.js`
- `npm run build`

