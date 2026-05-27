# Visual Bible

Date: 2026-05-27

## Overall Art Direction

Rebuild the game around warm Sonoran adventure clarity:

- top-down 2D adventure
- dusk neighborhood warmth
- readable silhouettes
- tactile tools and repair spaces
- clean environmental shapes
- child-readable composition

Do not use the existing Phaser scene art as visual reference. Old scenes are behavioral references only.

## Camera Perspective

- 2D top-down adventure camera with slight stage composition.
- Player stays near center with gentle follow.
- Important interactions should sit inside the central two-thirds of the viewport.
- Camera should not need dense UI labels to explain the scene.

## Scale Rules

- Base tile: 32 px.
- Zuzu placeholder: about 40-48 px tall.
- NPC placeholder: similar height, slightly distinct shape/color.
- Bike: about 72-96 px long.
- House/garage: large simple blocks with visible doors/porch/driveway.
- Bridge: readable as a span across wash; no tiny structural details in placeholder phase.
- Interaction marker: 20-28 px, high contrast, non-obstructive.

## Character Proportions

Placeholder:

- compact body
- larger head/helmet/cap shape
- clear shirt color
- small shadow

Production target:

- large readable head
- compact body
- strong color block
- consistent bottom-center anchor
- minimal facial detail at gameplay scale

## Environment Proportions

- Streets and sidewalks should be wide enough for forgiving movement.
- Houses should frame the play area, not become dense decoration.
- Desert wash should read as terrain constraint: sandy channel, rocks, edges, crossing point.
- Bridge should read from silhouette first: two supports, deck, triangle/truss hint.

## Color And Mood

Palette direction:

- cool dusk shadows: blue-gray, muted green, violet
- warm safety cues: amber porch/garage light
- desert notes: tan, sage, palo verde green, rust
- interaction highlights: amber or turquoise
- success: warm green

Avoid:

- one-note purple/blue gradient worlds
- dark unreadable greens
- beige-only desert palettes
- high-saturation toy plastic
- dashboard-style neon UI

## Arizona / Desert / BMX / Adventure Inspiration

Use:

- Sonoran neighborhood edges
- dry washes and culverts
- cacti, palo verde, mesquite, creosote
- bike paths, ramps, chalk, tire marks
- garage workbench warmth
- small Zelda/Pokemon-like readability
- BMX repair and maker-space object language

Avoid:

- generic fantasy villages
- generic suburban clip art
- sterile lab dashboards
- photorealistic collage

## Readability Rules For Children

- One primary interaction per local screen region.
- Every interactable needs a unique silhouette.
- Important props need grounding shadows.
- Text should support the visual, not rescue it.
- Dialogue must be large and short.
- Color should guide, not overwhelm.
- Do not hide objectives in visual clutter.

## UI Overlay Rules

- React owns shell and accessibility-heavy text UI.
- Phaser owns world, movement, markers, and simple in-world bubbles.
- HUD should be light and optional.
- Debug overlay must be toggleable.
- Dialogue panel should be readable, warm, and not cover the player when possible.
- Never make normal play feel like an editor or dashboard.

## No-Clutter Rules

- Do not scatter props to fake richness.
- Do not show every tool at once.
- Do not use dense labels in the world.
- Do not decorate with assets that have no gameplay or mood role.
- Do not import generated concept art directly into the playfield.

## Generated Concept Art Evaluation

Generated concepts may inform:

- composition
- silhouette
- palette
- camera angle
- object grouping
- emotional tone

Reject generated concepts with:

- malformed bikes
- wrong mechanical relationships
- unreadable small parts
- fake/random text
- inconsistent perspective
- over-detailed backgrounds
- generic fantasy UI
- disconnected props

## Placeholder To Production Graduation

A placeholder graduates only when:

1. gameplay role is stable
2. scale is known
3. silhouette requirements are documented
4. concept candidates are curated
5. final sprite is authored or cleaned in the final art pipeline
6. asset key remains stable through `AssetRegistry`
7. screenshot tests still pass

Production art may replace a placeholder file or asset key, but should not require rewriting scene logic.
