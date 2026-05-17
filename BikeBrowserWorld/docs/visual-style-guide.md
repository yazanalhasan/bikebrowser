# BikeBrowserWorld Visual Style Guide

## Target Feeling

BikeBrowserWorld should feel like a warm Sonoran dusk adventure: readable like Pokemon, cozy like Animal Crossing, and tactile like a small Zelda village. The first slice should feel handmade and inviting, not like debug geometry.

## Camera

- View: 2D top-down adventure RPG with slight stage-like composition.
- Framing: keep Zuzu near center with soft movement look-ahead.
- Scale: one child character is roughly 48-58 px tall in the current 1280x720 viewport.
- Camera motion: smooth, damped, and quiet. It should anticipate walking direction without feeling slippery.

## Tile And Prop Scale

- Base tile target: 32 px for future tilemaps.
- Major world blocks: assembled from 32 px multiples.
- Character collision: smaller than visible silhouette so movement feels forgiving.
- Props should overlap slightly and cast small dark grounding shadows.

## Shape Language

- Characters: large head, compact body, strong color block, readable cap/backpack/tool identity.
- Props: softened rectangles, diamonds, triangles, and simple silhouettes until painted sprites exist.
- Avoid perfectly generic blocks unless they are construction guides hidden behind art.
- Every important interactable needs a unique silhouette before final art.

## Outline And Shadow Rules

- Use soft dark base shadows under characters, bikes, tools, and repair stations.
- Do not use heavy black outlines everywhere. Prefer warm dark colored outlines: `#2a1b1c`, `#1b2635`, `#3a2117`.
- Interactable prompts can pulse, but the world art should remain calm.

## Lighting

- Street: cool dusk ambient with purple-orange sky accents.
- Garage: warm amber light pools against cooler shadows.
- Porch lights and garage lights should pull the eye toward safe destinations.
- Use layered polygons now; replace with painted light masks later.

## Palettes

### Dusk Sky
- Deep blue: `#172942`
- Dusk violet: `#6f496b`
- Road blue-gray: `#242d38`
- Sidewalk gray: `#51606d`

### Warm Garage
- Back wall: `#4b2d1e`
- Floor: `#c3a875`
- Workbench: `#80512e`
- Warm light: `#e8b45566`
- Rug red: `#8b4a4a`

### Desert Terrain
- Rock tan: `#a78b76`
- Dark rock: `#7f7369`
- Cactus green: `#4f9c75`
- Plant highlight: `#5aa67b`

### Characters
- Zuzu shirt: `#168fca`
- Zuzu cap: `#f4603c`
- Zuzu skin: `#da905d`
- Backpack: `#313756`
- Mr. Chen shirt: `#c68d55`
- Mr. Chen cap: `#3d485a`

### Interactions And Rewards
- Highlight amber: `#f7c46d`
- Repair success green: `#45c778`
- Reward gold: `#f0c34e`
- Warning red: `#d94b45`

## Environment Density

Every screen should include:
- One destination cue, such as a lit garage or porch.
- Two or more story props, such as notes, stickers, tools, ramps, or tire tracks.
- Three or more natural details, such as rocks, desert plants, cracks, or dust.
- One repair-learning clue that does not require text.

## Garage Style

The garage is the emotional home base. It should feel safe, warm, and useful. Keep warm light near the workbench and bike stand. Place tools and notes where a child would want to inspect them. Avoid sterile workshop layouts.

## Sonoran Neighborhood Style

The neighborhood should feel calm, real, and slightly mysterious at dusk. Use cool ambient colors, warm porch lights, cacti, rocks, curbs, driveways, tire marks, and small kid-made details like ramps or chalk-like marks.

## UI Style

- HUD is lightweight and short.
- Prompts should pulse softly and name the action.
- Dialogue should feel like a warm storybook panel, not a debug box.
- Reward popups should be celebratory but brief.

## Animation Style

- Characters breathe subtly while idle.
- Walking uses squash, lean, and tiny head bob before final sprite sheets exist.
- Interactables pulse only when the player is in range.
- Repair actions should show visible state changes: tube appears, patch sticks, pressure fills.

## Audio Direction

- Audio begins only after a user gesture.
- Neighborhood: low crickets, faint wind, minimal music tone.
- Garage: soft hum, warmer drone, gentle repair clicks.
- Rewards: small three-note chime.
- TTS: optional, warm, subtitle-safe, and cancellable.

## Production Asset Pipeline

1. Paint or generate a small 32 px tile kit for sidewalk, road, driveway, dirt, curb, and garage floor.
2. Create prop sheets for cactus, rock, fence, ramp, tools, notes, bike parts, and tire marks.
3. Create Zuzu and Mr. Chen as sprite sheets with idle/down/side/up walk loops.
4. Replace polygon placeholders one category at a time, keeping the current scene names stable.
5. Keep Web export texture memory low: prefer small atlases and reuse.

## Layer Contract

Production scenes should be organized in this order:

1. `FloorLayer`: TileMapLayer-ready floor, road, sidewalk, and ground texture.
2. `WallLayer`: room walls, exterior building faces, fences, and hard background silhouettes.
3. `ShadowLayer`: grounding shadows and large ambient occlusion shapes.
4. `PropLayer`: y-sorted reusable props such as workbenches, pegboards, shelves, plants, bins, and ramps.
5. `InteractableLayer`: quest hotspots, repair stations, doors, bikes, and anything with prompts.
6. `LightingLayer`: warm pools, lamp glows, porch glow, dusk gradients, and soft falloff.
7. `FXLayer`: particles, repair feedback, reward bursts, dust, and small animation accents.
8. `NPCLayer`: y-sorted NPCs and dialogue anchors.
9. `PlayerLayer`: Zuzu and companions.

Godot 4 production scenes should prefer `TileMapLayer` for tile grids because `TileMap` is deprecated. Each `TileMapLayer` represents one tile layer, which matches the layer contract above. Y-sort should be enabled on the parent layer where character/prop overlap needs depth.
