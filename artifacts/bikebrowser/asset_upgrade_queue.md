# BikeBrowser Asset Upgrade Queue (Executive Brain)

Ranked by **impact on player care + polish** for the Act-1 demo. Pairs with
asset_audit.md and the art/style bibles. **Live gameplay assets require a
`replacement_proposal.md` (current/problem/strategy/benefit/risk) + human review
before swapping** — no automatic replacement. Workflow: Concept → Style validation →
Generation (ComfyUI+SDXL/Aseprite) → Consistency review → Human review → Production.

| # | Asset | Status | Impact | Action | Gate |
|---|---|---|---|---|---|
| 1 | **Dex unique sprite** (currently tinted Zuzu clone) | placeholder | **High** — a key character reads as a recolor of the player | author a distinct cocky-kid sheet in Aseprite (teal accent, spiky hair, BMX vibe) | proposal + human review |
| 2 | **Port Tier-1 painted backgrounds** into web scenes (e.g. `desert_sky_dusk`) | production-ready (unused in web) | **High** — biggest visual lift; sets the warm pixel-JRPG tone | convert/scale Godot painted bgs → `src/game/art/final/act1/`; repoint scene backdrop keys | proposal + human review |
| 3 | **Live SVG placeholder props** (gps_post, prop_replacement_*, vegetation_cluster, map_frame) | placeholder but LIVE | **Med-High** — visible flat geometry in active scenes | repaint as pixel props (Aseprite), one per replacement proposal | proposal + human review |
| 4 | **Mr-Chen chromatic-fringe frames** | replace | **Med** — AI-upscale halos on a major NPC | clean in Aseprite | proposal (cosmetic) |
| 5 | **Ecology vector blobs** (`public/assets/ecology/*`) | replace | **Med** — desert plants are thematic (ecology quests) | repaint as pixel | proposal |
| 6 | **Scale/density enforcement** across props | inconsistent | **Med** — coherence | re-export from `.aseprite` at one standard | review |
| 7 | **Glossy neon app icons** (`assets/icons/*`) | replace | **Low** — off-brand but rarely seen in-game | re-style warm pixel | low priority |
| 8 | **Retire excluded draft SVG environment files** | placeholder (already runtime-excluded since P0) | **Low** — bundle hygiene | delete files + remove SVG generator (part A; near-no-op for runtime) | safe |

## Notes
- Items 1–3 are the highest emotional/visual ROI for the Act-1 demo.
- Everything here is **art part B** (human-gated) except #8 (part A, safe).
- No local multimodal critique → the human-review gate is mandatory for visual
  quality on every production swap.
