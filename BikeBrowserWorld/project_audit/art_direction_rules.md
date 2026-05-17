# Art Direction Rules

Generated: 2026-05-15

## North Star

BikeBrowserWorld should feel like a warm Sonoran neighborhood adventure at dusk: tactile, handmade, safe, curious, and mechanically readable. The art should support learning by making physical objects understandable, not by adding explanatory clutter.

Reference feel:

- Cozy hometown RPG.
- GBA/SNES-era readability.
- Warm desert suburb at dusk.
- BMX repair culture, approachable and kid-safe.
- Slightly stylized, not clipart, not realistic simulation.

## Core Style

| Rule | Target |
|---|---|
| Camera/readability | Top-down/three-quarter RPG readability. Objects must read clearly at 720p and 1080p. |
| Pixel density | Target props around 2x-3x the density of simple tile art; avoid mixing ultra-detailed painterly props with flat vector bases. |
| Outline | 1-2 px dark warm outline on important interactables; softer/no outline on distant background. |
| Shading | Simple hand-painted pixel shading with 3-5 value groups per object. |
| Shadow direction | Dusk light from upper-left/front-left; shadows fall down-right. |
| Shadow style | Soft oval or painted grounding shadows, warm blue-purple, 25-45% opacity. Avoid hard black blobs. |
| Materials | Wood, rubber, metal, dusty pavement, desert plant waxiness, warm garage light. |
| Animation | Subtle 2-6 frame loops. Gentle idle motion, no noisy bobbing unless a character/prop needs attention. |

## Palette

### Dusk Neighborhood

- Sky purple: `#6f5471`, `#816078`
- Warm sunset band: `#d19163`, `#e0a86f`
- Shadow blue: `#203247`, `#2d3a46`
- Asphalt: `#28323a`, `#343d43`
- Sidewalk warm gray: `#b7aea1`, `#d1c4ad`
- Porch/garage glow: `#ffd27a`, `#f3a75a`
- Desert greens: `#6fa66a`, `#8fbd69`, `#4f7c58`
- Accent coral/red: `#e85d58`, only for small focus details.

### Garage

- Wall warm plum: `#3d2a2f`, `#52373c`
- Concrete floor: `#56504b`, `#706a61`
- Workbench wood: `#7a4f2f`, `#b07345`
- Tool metal: `#9aa4a8`, `#d1d6d4`
- Grease/oil: `#1f2326`, blue-tinted highlights.
- Light glow: `#ffd98a`, transparent edges.

## Scale Rules

| Object | Approx gameplay footprint |
|---|---|
| Zuzu | 48-64 px tall on screen |
| Adult NPC | 56-72 px tall |
| Parked BMX | 80-110 px wide |
| Repair stand BMX | 140-170 px wide |
| Small repair station bike | 100-120 px wide |
| House facade | 180-260 px wide |
| Garage workbench | 120-180 px wide |
| Saguaro | 70-120 px tall depending depth |
| Fence segment | 64-96 px wide |

Keep all interactable objects large enough that the player can understand what they are before reading text.

## Bike Rendering Rules

Bikes are the heart of the game. They must never look like generic clipart.

Bike sprites must include:

- BMX-inspired compact frame geometry.
- Chunky readable tires.
- Clear handlebar and saddle silhouettes.
- Visible crank/chainring on repair objects.
- Rear sprocket or derailleur suggestion when chain repair matters.
- Warm rubber/metal highlights.
- Small personality details: sticker, colored frame, worn grips.

Avoid:

- Thin vector lines.
- Photo-realistic chrome.
- Overly complex mountain-bike details at tiny scale.
- Generic mobile-game side bicycle icons.
- Pure black chain/wheel shapes with no material read.

## Environmental Rules

### Neighborhood

- Houses should have warm window/porch light and readable front doors.
- Roads need subtle texture: cracks, tire scuffs, painted lines, curb shadow.
- Sidewalks need seams and bevels.
- Plants should be grounded with soft shadows.
- Interaction locations should be discoverable through world art: light, sign, object silhouette, or character staging.

### Garage

- The garage must feel like a safe creative den.
- Use layered clutter, but keep the repair station clear.
- Put the brightest warm light near the current repair object.
- Keep background clutter lower contrast than interactables.
- Tools should be recognizable silhouettes, not abstract rectangles.

### Side Areas

- Desert, mine, and river can remain simpler than the main slice, but their ground should not be flat single polygons once they become core gameplay spaces.
- Each region needs a unique ground texture family and a clear transition marker back home.

## UI Rules

- UI should feel warm and tactile, like notebook labels, small cards, and friendly signage.
- Avoid black opaque debug panels.
- Use rounded corners only lightly; keep cards compact.
- Prefer small icons for rewards: badge, coin/allowance, sparkle, quest marker.
- Interaction prompts should use a keycap/icon plus 2-3 words max.
- Dialogue box should reserve room for portrait art later.

## Layering Rules

Recommended visual layers:

1. Far background: sky, mountains, distant silhouettes.
2. Ground: grass/desert yard, road, sidewalk, driveway, floor.
3. Background props: houses, fence back row, garage wall.
4. Mid props: interactables, bikes, NPCs, player.
5. Foreground props: tall plants, lamps, foreground clutter.
6. Lighting: glow sprites, dust, sparkles.
7. UI: dialogue, prompts, rewards.

Use y-sort for character/prop overlap where possible. If y-sort is not used, manually maintain consistent z-index by object depth.

## Replacement Acceptance Checklist

Before an asset is accepted:

- Reads clearly at gameplay scale.
- Uses dusk palette or adapts cleanly to it.
- Has soft grounding shadow or is designed to receive one.
- Matches outline thickness of nearby sprites.
- Does not look like vector clipart.
- Does not introduce a new palette family unless it is a deliberate accent.
- Supports the educational interaction it belongs to.

