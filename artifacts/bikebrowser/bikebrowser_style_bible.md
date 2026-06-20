# BikeBrowser Style Bible (Executive Brain)

Concrete visual spec for the **pixel-JRPG / anime-adjacent** identity. Authoritative
for any new asset or generation prompt. Reference: `docs/game_rebuild/visual_bible.md`.

## Palette
- **Warm Sonoran base:** sun-bleached sands (#cdb389, #ddbc88), adobe oranges/clays
  (#cf9266, #b6552f), warm dark outlines (#241b14). Sky gradients dusk-to-day
  (golds #f8d894 → ambers #d39a5c).
- **Accent cues (UI/cues):** wrench-gold #f2c46d, heart-coral #f09d72, star-lavender
  #bec8ff. Dex's rival accent: teal #5fc6d8.
- Avoid: neon/glossy mobile-icon palettes; cold/desaturated photoreal tones.

## Lighting
Warm, directional, time-of-day aware (the dusk backgrounds are the gold standard).
Soft ground shadows (ellipse, ~18% black). Two-tone shading, not gradients-on-
everything. Readable silhouettes over realism.

## Character proportions & NPC style
- Kid protagonist & peers (Zuzu, Dex): chibi-leaning JRPG kids, large readable heads,
  expressive faces, spiky/simple hair, 4-direction sheets (~96×96 walk).
- Adults (Mr. Chen, Mrs. Ramirez, Auntie Mariam): grounded JRPG NPCs, distinct
  silhouette + palette per character, warm faces. One scale across NPCs.
- **Distinct silhouette + one signature color per character** (readability first).

## Environment style
Top-down Sonoran adventure; hand-feel pixel backgrounds (saguaro silhouettes,
washes, adobe homes). Painted-pixel backgrounds (Tier 1) preferred over procedural
or vector. No vector clipart. Terrain reads as a constraint (the wash, the sun).

## UI / icon / dialogue style
- UI: warm parchment panels (#fff0c7) with dark warm strokes; the Leonardo-notebook
  diegetic motif is on-brand. Fonts layout-configurable (HUD).
- Icons: pixel, warm, in-world — **avoid glossy app-store badges** (explicitly
  rejected).
- Dialogue: bottom-centered box; choice list above it (▸ highlight). Portrait style
  (future): pixel bust matching the character sheet, warm and expressive — NOT
  cel-anime.

## Animation style
Gentle idle bob (Sine yoyo), 4-frame walk cycles, subtle — readable over flashy.
Snap/lock/error audio cues pair with construction feedback.

## Reference / approved / rejected
- **Approved (Tier 1):** `BikeBrowserWorld/Assets/Backgrounds/desert_sky_dusk.png`;
  character sheets for Zuzu walk, Mr. Chen, Mrs. Ramirez.
- **Rejected:** SVG-geometry "final" environment vistas; ecology vector blobs;
  watermarked DRAFT props (purged); glossy neon icons; any cel-anime overlay.
- **Pending unique art (art part B):** Dex sprite (currently tinted Zuzu placeholder);
  porting Tier-1 painted backgrounds into web scenes.

## Generation rule
Any SDXL/ComfyUI generation must lock a style (LoRA + prompt template + seed
discipline) to this spec, pass the AI-art workflow, and clear human review before
production. No isolated one-off assets.
