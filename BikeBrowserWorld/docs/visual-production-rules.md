# Visual Production Rules

## Target

Warm stylized 2.5D/isometric garage adventure:

- Cozy Sonoran dusk neighborhood
- Warm garage interior
- Zelda/Pokemon/Rune Factory readability
- Quest-for-Glory warmth
- Handcrafted indie RPG atmosphere

## Perspective

- Camera: angled top-down / isometric-inspired, not strict mathematical isometric.
- Floors and roads use readable angled planes.
- Walls use shallow vertical faces with warm side shading.
- Props use bottom-center anchors for Y-sort.

## Tile and Sprite Scale

- Base tile: `32x32`
- Character frames: `48x64`
- Small props: `32x32` or `64x64`
- Large furniture: `96x64`, `128x96`, or scene-specific sheets.

## Silhouette and Outline

- Characters need readable silhouettes at game scale.
- Use 1 px dark warm outline for characters and important interactables.
- Use softer outline or no outline for background clutter.
- Interactables may receive a warm edge highlight on hover/focus.

## Palette

Dusk exterior:

- Deep sky: `#1b2238`
- Purple horizon: `#3a2441`
- Cool shadow: `#2b3145`
- Desert ground: `#a36d3d`

Warm garage:

- Wall ochre: `#8a5a31`
- Lit wall: `#c18445`
- Workbench wood: `#704420`
- Lamp glow: `#f4b95b`
- Shadow brown: `#3a241c`

Interaction/reward:

- Prompt gold: `#ffd166`
- Repair green: `#8bd17c`
- Caution amber: `#f0a43a`
- Reward blue: `#63c7ff`

## Lighting

- Exterior is cool dusk with soft contrast.
- Garage is warm and safe, with pools around lamps/workbench.
- Shadows should pool beneath props and characters.
- Do not overuse bloom; Web export must stay light.

## Environment Density

Every room/area should answer:

- Who uses this space?
- What were they doing before Zuzu arrived?
- What can Zuzu touch?
- Where is the warm light?

Garage density targets:

- Tool wall, workbench clutter, parts bins, bike stand, rug, notes, stickers, plants, storage, spare bikes.

Neighborhood density targets:

- Sidewalk cracks, tire marks, chalk drawings, cacti, porch lights, ramps, fences, mailboxes, repair signs.

## Animation Cadence

- Idle loops: 8-12 frames, subtle breathing.
- Walk loops: 6-8 frames per direction.
- Repair loops: 4-8 frames with tactile pauses.
- UI/reward pulses: 6-12 frames, quick ease-out.

## Zuzu Protagonist Direction

Zuzu is a joyful dry-wash explorer with short brown hair, a bright playful yellow patterned shirt, soft gray pants, muddy shoes, and a curious adventure-stick silhouette for outdoor scenes. Keep the character stylized and emotionally recognizable without chasing photoreal likeness.
