---
name: world-map-polish
description: Final polish pass on the world map — anchors region nodes into their biome (dust patch under desert nodes, rocky base under mountain, etc.), removes the large translucent zone circles around nodes, dims inactive labels, and adds a subtle camera-edge vignette. Cosmetic-only; no behavior changes. Runs after terrain + paths + landmarks land.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the cosmetic polish layer of the legacy 2D world map. The
underlying terrain, paths, and landmarks already exist by the time
this agent runs. Your job is the visual refinement pass.

## Files in scope

- `src/renderer/game/scenes/WorldMapScene.js` — the node-render block,
  the label-render block, and one new top-level overlay graphics
  object for the vignette.

## Out of scope

- Terrain, paths, landmarks (other agents).
- Click handlers / interactivity (read-only on those — DO NOT change
  what nodes do, only how they look).
- Anything under `src/renderer/game3d/`.

## First cycle goal — points 5, 8, 9 of the design spec

### Point 5: Anchor nodes into the terrain

For each region node:
1. Look up the region's biome (already tagged on regions.js).
2. Render a small biome-matching base UNDER the node icon:
   - DESERT → faded tan ellipse (32×10 px, `rgba(180,150,100,0.5)`)
   - GRASSLAND → soft green ellipse
   - MOUNTAIN → small gray rocky base (irregular shape made of 2-3
     overlapping ellipses)
   - WATER → light blue ellipse with a tiny dock-like rectangle
   - ROCK → dark gray flat ellipse
   - URBAN → light gray square outline
3. Render a separate 1-px subtle drop shadow ellipse under each node
   (`rgba(0,0,0,0.18)`, offset y+2).

Result: nodes look planted, not floating.

### Point 8: Remove visual noise

1. **DELETE** the large translucent zone circles around nodes — find
   them in WorldMapScene.js (search for any `fillCircle` in node
   rendering or anywhere else that draws semi-transparent rings around
   nodes). The new terrain layer has already replaced their function
   of indicating "this region exists here."
2. Reduce inactive label opacity to ~0.7 (read existing label setup;
   add `setAlpha(0.7)` to default state).
3. Active node label stays at 1.0 alpha + slight outline glow if
   trivial to add.
4. Verify node icons + labels still pass click hit-detection.

### Point 9: Camera vignette

Add a single fullscreen overlay Graphics:
- Rendered on TOP of everything (depth: 1000 or scene end).
- A radial darkening from center (transparent) to edges (~30% black).
- Implementation: 4 trapezoidal Graphics on each edge with alpha
  gradient toward the center, OR a single Graphics with a radial
  gradient if Phaser version supports it (don't fight Phaser's API —
  the trapezoid trick is cheap and works everywhere).
- `setData('occlusionRole', 'safe')` so any future occlusion probe
  doesn't flag it.

## Standards

- JavaScript only.
- DELETE — don't comment out — the translucent zone circles.
- Vignette must NOT block input (`setInteractive(false)`).
- Cosmetic only. Click handlers, transitions, unlock logic untouched.
- No new top-level dependencies.

## Receipt requirement

Write to: `.claude/swarm/receipts/world-map-polish-<ISO timestamp>.json`

In `notes`:
- The line range of the deleted translucent zone circles
- Confirmation that all node click handlers still work (test 2-3
  nodes mentally: which click → which scene transition)
- The vignette implementation choice (trapezoids vs radial gradient)
- Any node whose biome base looks visually wrong (tuning note)

Suggest `next_agent_suggestions: []` — this is the terminal polish agent.
