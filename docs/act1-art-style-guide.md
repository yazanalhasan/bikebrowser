# BikeBrowser Act 1 — Art Style Guide (placeholder replacement pass, 2026-11-26)

**Reference library:** `BikeBrowserWorld/Assets/{Props,Characters,Backgrounds}` on branch `eb/p0-defect-sweep@a0d706d`.
All new art matches that library, not the older ART_BIBLE "soft painterly cartoon" line.

## Look
- 16-bit SNES-era detailed pixel art. Crisp pixels, no anti-aliased soft edges on the silhouette.
- 3/4 top-down camera for props and characters. Flat orthographic view for ground tiles.
- Warm Sonoran/Arizona palette: ochre, terracotta, sage, saguaro green, sky blue accents.
- Outline is a 1-px dark warm brown (#2a1a14-ish), not pure black. Soft key light from the top left.
- No text, letters or logos inside sprites. Signs are blank; the UI draws labels.
- No culture-specific costume. People wear everyday modern clothes and carry no religious markers.

## Sizes / specs
- **Characters:** 384x384 sheets of 4x4 frames at 96x96. Feet baseline at y=91, centered at x=48. Kid height is about 80–84 px; adults are about 84 px.
  - Walk rows: down, left, right, up.
  - Idle rows (Zuzu): down, right, left, up.
  - NPC idle/talk rows (MrsRamirez convention): down, left, right, up.
- **World props:** transparent PNGs trimmed to the bbox, longest side capped at the per-slot `max_px` in the manifest (24–160 px).
- **Ecology sprites:** 128x128, centered, transparent.
- **Tiles:** 64x64, seamless (offset-blended). Scene grounds are seamless textures.
- **Atlases:** frame layout matches the PR #10 JSON exactly. neighborhood.png is 960x480 with 160x120 cells. zuzu.png is 576x448 with 96x112 cells.

## Pipeline
1. Raw art is made on solid magenta (#FF00FF) or keyed with rembg.
2. Chroma-key, then keep the largest component, then defringe.
3. Downsample with a premultiplied box filter and threshold alpha to hard edges.
4. Record provenance in manifest.json.

Generated art stays "reference" until EB curates and registers it (asset_provenance_policy).
