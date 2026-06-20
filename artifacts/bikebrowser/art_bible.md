# BikeBrowser Art Bible (Executive Brain)

**Approved visual identity (locked):** Pixel-JRPG · anime-*adjacent* · warm ·
expressive · readable · character-driven. SNES/GBA-inspired, top-down Sonoran
adventure, Zelda/Pokémon readability. Pairs with `docs/game_rebuild/visual_bible.md`
and `docs/game_rebuild/art_consolidation_worklist.md`.

**Do NOT:** switch to photorealism; switch to full cel-anime; introduce incompatible
styles; create visual inconsistency. "Anime-adjacent" means warm JRPG-pixel with
expressive characters — *not* cel-anime overlays.

## Tooling (what is actually used)
- **Aseprite** — primary pixel authoring (98+ `.aseprite` sources). The production
  path for sprites/props.
- **ComfyUI + SDXL** (local, RTX 5090, `C:\AI\ComfyUI`) — concept/staging only today;
  the lever for any future generated art. ControlNet/Flux not installed (needed for
  pose/silhouette consistency before character generation).
- **Meshy.ai / Hunyuan3D** — image→3D `.glb` props (off the 2D main path; an
  unresolved 2D-vs-3D scope bet — keep 2D-first for Act 1).
- **Procedural Phaser geometry** — in-code placeholder textures (clean-placeholder
  tier; acceptable as graceful fallback, not as "final").
- Avoid: SVG-geometry "production" generators (they produced the placeholder slop;
  do not promote their output to runtime).

## Tiering (the honest state)
- **Tier 1 (on-style, keep):** painted pixel backgrounds (e.g. `desert_sky_dusk`),
  best character sheets (Zuzu walk, Mr. Chen, Mrs. Ramirez). The North Star.
- **Tier 2 (mixed):** garage interior, bridge prop, Leonardo notebook UI — fine in
  mood, varying scale/detail.
- **Tier 3 (off-style):** AI chromatic-fringe artifacts (e.g. some Mr-Chen frames),
  variant churn.
- **Tier 4 (placeholder, retire):** SVG-geometry "final" props, ecology blobs. The
  watermarked DRAFT assets were **already purged in P0**.

## Art improvement authority (granted)
Executive Brain MAY improve artwork when an asset is clearly placeholder /
incomplete / draft-quality / inconsistent with this bible / objectively justifiable.
**Do not preserve poor assets just because they exist.** BUT do not auto-replace
**active gameplay assets** without a review proposal.

### Replacement-proposal format (required before swapping a live asset)
| Field | Content |
|---|---|
| Current asset | path + what it is |
| Issue | why it violates the bible (placeholder / off-style / artifact / scale) |
| Proposed replacement | source + pipeline (Aseprite / curated SDXL+LoRA) |
| Expected benefit | concrete visual/consistency gain |
| Risk | regression/scope risk + mitigation |

## AI art workflow (mandatory order)
**Concept → Style validation → Asset generation → Consistency review → Human review
→ Production.** Never generate random isolated assets. Maintain one style. Because
there is **no local multimodal critique**, the **human-review gate is required** for
visual quality — this is the "art part B" boundary.

## Current art posture (decision)
Act 1 ships on the existing pixel-JRPG tier. The visual upgrade (porting Tier-1
painted backgrounds into web scenes, retiring Tier-4 placeholders, giving Dex a
unique sprite) is **art part B** — proposal-driven, human-gated. See asset_audit.md.
