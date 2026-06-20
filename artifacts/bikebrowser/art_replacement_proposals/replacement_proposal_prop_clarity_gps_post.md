# Replacement Proposal — GPS Post Prop (Priority 3)

1. **Current asset:** `act1.prop_clarity.gps_post` — SVG-geometry-derived PNG
   (status `final_ready`, **live** in scenes; `ASSET_KEYS.propClarityGpsPost`).
2. **Current location:** `src/game/art/final/act1/` (raster from an SVG source);
   referenced via the act1 asset manifest + AssetRegistry.
3. **Where it appears in game:** the neighborhood world-scale/GPS clarity prop
   (navigation/landmark readability in NeighborhoodScene).
4. **Why it is inadequate:** SVG-geometry origin → flat vector look inconsistent with
   the painted/Aseprite pixel tier; placeholder-grade despite the `final_ready` tag.
5. **Replacement target:** a hand-feel **pixel** GPS/route post matching the warm
   prop tier (garage/workbench quality).
6. **Style constraints:** pixel-JRPG, warm palette, dark warm outline, readable at
   in-world scale; **same display size** as current to avoid layout shift; no vector
   clipart; no style drift.
7. **Proposed workflow:** Aseprite authoring at the current pixel scale (preferred for
   a small prop); reference the existing Tier-2 props for density.
8. **Expected benefit:** removes a visible flat-vector outlier; raises scene
   coherence.
9. **Risk:** **LIVE asset** — deleting/replacing without a same-size drop-in could
   break the scene render/scale. Mitigation: replace in place (same key + dimensions);
   validate render.
10. **Validation plan:** replace the file (same key/size); `npm run build`; smoke 1/1;
    **visual capture confirming the scene still renders** and the prop reads cleanly.
11. **Human review requirement:** **REQUIRED** (live gameplay asset).

---
**Pattern for the remaining live SVG props** (`prop_replacement.material_table`,
`prop_replacement.chemistry_bench`, `prop_replacement.bridge_debris`,
`environment.vegetation_cluster`, `ui.map_frame`, `world_scale_vista`,
`sonoran_landmark_set`, `map_gate`): each gets its own
`replacement_proposal_<name>.md` using this template — identify usage, propose a
same-size pixel replacement, generate/author a candidate, **require human review**,
and validate the scene still renders. Replace **one at a time**, never bulk; never
delete a live asset without a drop-in.
