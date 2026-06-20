# Art Priority Review (Executive Brain)

Review only — **no replacement.** Ranked by **immersion damage**, NOT by ugliness.
"Ugly asset" ≠ "high-priority." The question: *does this pull a new player out of the
experience?* Sources: `asset_upgrade_queue.md`, the replacement proposals, the visual
review pack.

## 1 — Critical (genuinely blocks immersion)
**None.** Everything renders, reads, and is playable. No art issue prevents a
coherent first-player experience. (This is the honest finding — the art is
placeholder-tier in places but not experience-breaking.)

## 2 — Important (noticeably hurts immersion / memorability)
| Asset | Why it hurts | Note |
|---|---|---|
| **Flat placeholder ground/environment** (SVG-derived) | pervasive — it's the surface under everything; the warm painted tier (Tier 1) exists but isn't ported, so the world reads as flat green | biggest single immersion lift; art-queue #2 |
| **Dex tinted-clone sprite** | a key character looks like a recolor of the player → undercuts his identity and memorability (already the highest-variance character) | art-queue #1; proposal ready |
| **Community Crossing figures (circles) + procedural backdrop** | the emotional climax carries its weight on text alone; visuals are minimal | art-queue / proposal; words currently do the work |

## 3 — Cosmetic (polish; low player impact)
| Asset | Why low | Note |
|---|---|---|
| Live SVG props (gps_post, material_table, etc.) | small, in-scene, easily overlooked | one-at-a-time, proposal-gated |
| Mr-Chen chromatic-fringe frames | minor AI-upscale halos on some frames | cleanup |
| Glossy neon app icons | rarely seen in-gameplay | low |
| 8 dangling draft manifest entries | no visual effect (loader skips) | cleanup, not visual |

## Recommendation
For *playtest readiness*, **do not block on art** — it's all Importance-tier or
below, and playtesters expect demo-grade art (the playtest package discloses this).
**Highest-ROI art work, post-feedback:** (1) port the Tier-1 painted backgrounds
(kills the flat-ground problem broadly), (2) the unique Dex sprite, (3) the Community
Crossing backdrop. All human-gated; all already proposed.
