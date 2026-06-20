# Art Consolidation Worklist (P1 item 6)

Goal: unify on the best existing **pixel-JRPG / anime-adjacent** tier. Style is
**not** changing (no cel-anime re-vision). Per the project's own audit, *visual
quality judgment requires a human pass* — this worklist separates the safe,
mechanical consolidation (doable autonomously) from the human-curated visual
replacement.

## Findings (corrects the initial audit's worst case)
- **Character art is already clean.** Each final sheet
  (`zuzu_walk_native96_sheet`, `zuzu_repair_4dir_sheet`, `mr_chen_talk/repair`,
  `mrs_ramirez_talk/cheer`, `auntie_mariam_style_reference`) is referenced
  exactly once via `ACT1_CHARACTER_ANIMATION_SHEETS`. No dead-variant sprawl.
- **The "good tier" target** is the Godot painted backgrounds in
  `BikeBrowserWorld/Assets/Backgrounds/` (e.g. `desert_sky_dusk.png`) — these are
  the strongest, most on-brief assets and should anchor the web scenes.
- **Mislabeled SVG "final" assets are dead weight, not shown in-game.** Entries
  like `act1.environment.sonoran_mountain_vista` (SVG-derived PNG, status
  `final_ready`) and `act1/zuzu.png` (SVG blob) are loaded into the texture cache
  but **no scene renders their finalKey** — verified by grep. They inflate the
  bundle and lie about being "final," but they do not appear on screen
  (scenes use procedural fallbacks or the good sheets).

## A. Safe mechanical cleanup (low-risk, no visual judgment)
1. Retire the scene-unreferenced SVG "final" assets from the manifest + disk
   (verify each finalKey has zero scene references first, exactly as the P0
   draft purge did): `environment_sonoran_mountain_vista`, the other
   `act1.environment.*` SVG vistas, and `act1/zuzu.png`. Each has a procedural
   fallback or is unused.
2. Downgrade any remaining SVG-generator output still tagged `final_ready` in
   `act1AssetManifest.js` to a non-final status so it can never masquerade as
   final art.
3. Delete the `tools/generate-act1-production-assets.js` SVG-geometry generator
   (the source of the placeholder slop) once its outputs are retired.

## B. Human-curated visual pass (requires a person's eye — do not automate)
4. Port the good Godot painted backgrounds into the web pipeline: copy/convert
   `BikeBrowserWorld/Assets/Backgrounds/*` to `src/game/art/final/act1/` at the
   correct scale, add manifest entries (status `final_ready`), and point the
   relevant scene backdrop keys at them (replacing the procedural
   `createEnvironmentBackdrops` placeholders where a painted background is better).
5. Clean the chromatic-fringe artifacts on `mr_chen_*_sheet.png` (AI-upscale
   halos) in Aseprite.
6. Enforce one pixel scale/density across props (the art bible's standard);
   re-export inconsistent props from the `.aseprite` sources.

## Why B is gated on a human
The environment has no local multimodal critique; "does this look like a
compelling pixel-JRPG scene?" is a judgment call. Automating the swap risks the
exact style inconsistency the art direction forbids. A/B is the correct split:
ship A autonomously (bundle hygiene, no visual change), schedule B with a human
reviewer in the loop.
