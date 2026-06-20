# BikeBrowser Asset Audit (Executive Brain)

Status legend: **production-ready** · **placeholder** · **incomplete** · **replace**
· **remove**. Detailed provenance in the earlier graphics audit; consolidation plan
in `docs/game_rebuild/art_consolidation_worklist.md`.

## Summary verdict
~25–30% of assets are genuinely on-style (Tier 1, keep); ~40% are placeholder/vector
slop; the rest mid. The pipeline is fine — the **asset set + discipline** need work.
The fix is **consolidation + retirement**, not a pipeline rebuild. The
DRAFT-watermarked assets were **already purged in P0** (loader now loads only
`final_ready`).

## Asset groups
| Group | Location | Status | Action |
|---|---|---|---|
| Painted pixel backgrounds | `BikeBrowserWorld/Assets/Backgrounds/*` (e.g. desert_sky_dusk) | **production-ready (Tier 1)** | port into web scenes (part B) |
| Best character sheets (Zuzu walk, Mr. Chen, Mrs. Ramirez) | `src/game/art/final/act1/characters/*` | **production-ready** | keep |
| Mr-Chen frames w/ chromatic fringe | same | **replace** | clean in Aseprite (proposal) |
| Garage/workbench, bridge prop, notebook UI | `src/game/art/final/act1/*` | **production-ready (Tier 2)** | keep; tighten scale |
| SVG-"final" environment vistas (sonoran_mountain_vista, etc.) | `src/game/art/final/act1/environment_*` (status now `draft`) | **placeholder** | already excluded from runtime by P0 loader; retire files in part-A follow-up |
| SVG-"final" props (gps_post, prop_replacement_*, vegetation_cluster, map_frame…) | manifest `final_ready` | **placeholder but LIVE** | rendered in scenes → **replacement-proposal required** (do not delete blindly) |
| Ecology vector blobs | `public/assets/ecology/*` | **replace** | repaint as pixel (part B) |
| Watermarked DRAFT stubs | `public/game/assets/generated_drafts/*` | **removed** | done (P0) |
| Dex sprite | reused Zuzu sheet + teal tint | **placeholder (intentional)** | unique sprite (part B proposal) |
| 3D props (Meshy/Hunyuan `.glb`) | `generated_assets/*` | **incomplete/off-path** | defer (2D-first for Act 1) |
| Glossy neon app icons | `assets/icons/*` | **replace** | off-brand; re-style (low priority) |

## Live-asset caveat (must honor)
The SVG `final_ready` props are **rendered in scenes** = live gameplay assets. Per
the art-improvement authority, they require a **replacement proposal** (current /
issue / proposed / benefit / risk) before swapping — not silent deletion. This is
the "art part B" boundary and is **human-gated** (no local multimodal critique).

## Recommended sequence
1. **Part A (safe, low-risk):** retire the already-excluded draft SVG environment
   files; remove the SVG-geometry generator. (Mostly a no-op for runtime since P0.)
2. **Part B (human-gated):** replacement proposals for the live SVG props → port
   Tier-1 painted backgrounds → unique Dex sprite → clean chromatic-fringe frames →
   enforce one scale. Each via the AI-art workflow + human review.
