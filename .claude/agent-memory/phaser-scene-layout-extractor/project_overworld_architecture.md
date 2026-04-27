---
name: OverworldScene architecture
description: OverworldScene is largely data-driven — marker positions from registry, dimensions from WORLD const. Only relative offset constants and scene label extracted.
type: project
---

OverworldScene (1536×1024 canvas, extends Phaser.Scene directly) is a macro navigation map.

**Largely data-driven — not a room with static furniture:**
- Marker positions: `sceneDef.worldPos.x/y` from `getLocalScenes()` registry data
- Canvas dimensions: `WORLD.width/height` from `data/neighborhoodLayout.js`
- Boundary insets: `BOUNDARY_PADDING` (imported)
- Camera config: `CAMERA` (imported)
- `ENTER_RADIUS = 70`: gameplay proximity constant, EXEMPT

**What was extracted to layout JSON (6 objects):**
- `marker_circle`: r=22, stroke_width=3 (uniform for all markers)
- `marker_label`: y_offset=30 (label below marker)
- `marker_prompt`: y_offset=-34 (enter/lock prompt above marker)
- `marker_quest_indicator`: x_offset=18, y_offset=-18 (quest icon offset)
- `progress_bar`: w=40, h=4, y_offset=42 (locked-marker progress bar)
- `map_label`: x=768, y=1010 (static scene label, resolved from WORLD.width/2 and WORLD.height-14)

**Why:** All in-loop offsets are raw literals extractable to JSON to give layout editor visibility. NeighborhoodScene precedent (empty objects:{}) also valid given architecture note, but literals were present so they were extracted.
