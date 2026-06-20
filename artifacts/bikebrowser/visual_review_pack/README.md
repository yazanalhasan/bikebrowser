# Visual Review Pack (Executive Brain)

Playwright-captured screenshots for human review. Captured at 1280×800 on the live
`/game-rebuild` build.

## Contents
- `01_neighborhood_overview.png` — the hub: Zuzu (player) + the four NPCs + **Dex**
  (after the placement fix), the GPS/NEXT-RIDE HUD, quest trail, ecology zone.
- `02_crossing_beat_00..13.png` — every beat of **The Community Crossing Sequence**
  (the Act-1 emotional climax), including Mateo's run, Ramirez's relief, Mariam's
  seeds, Dex's care, Chen's wordless pride, and Zuzu's reflection.

## Highest-priority visual issues (objective)
1. **Dex is a tinted Zuzu clone** (green-tinted player body). Reads as distinct in
   position now, but the silhouette is the player's. → `replacement_proposal_dex_sprite.md` (Priority 1).
2. **Crossing figures are abstract colored circles** + the backdrop is the
   procedural wash (Tier-2). The climax deserves a painted backdrop + (optionally)
   better figure representation. → `replacement_proposal_community_crossing_backdrop.md` (Priority 2).
3. **Ground/environment is the flat placeholder tier** (SVG-derived); on-style
   painted backgrounds exist (Tier-1) but aren't ported to web scenes yet. → asset
   upgrade queue #2/#3.
4. (FIXED this pass) Dex previously overlapped Mr. Chen — repositioned to (960,940).

## Proposed replacement order (by impact)
1. Dex unique sprite (Priority 1).
2. Community Crossing painted backdrop (Priority 2).
3. Live SVG props, one at a time (Priority 3).
4. Port Tier-1 painted backgrounds into the main scenes.

## Notes for the reviewer
- The UI/HUD, dialogue boxes, and NPC character sheets (Chen/Ramirez/Mariam/Zuzu)
  are **on-style and readable** — keep them.
- Everything in the replacement queue is **human-gated**; nothing is auto-replaced.
- Capture script pattern: emit `crossing:start`, step beats with `KeyE`,
  `page.screenshot` per beat (see how this pack was generated in the validation
  report).
