# Replacement Proposal — Dex Sprite (Priority 1)

1. **Current asset:** Dex NPC sprite — the **Zuzu walk sheet reused with a teal
   tint** (`ASSET_KEYS.zuzuWalkSheet` + `setTint(0x5fc6d8)`).
2. **Current location:** `src/game/phaser/scenes/NeighborhoodScene.js` (Dex spawn);
   sheet at `src/game/art/final/act1/characters/zuzu_walk_native96_sheet.png`.
3. **Where it appears in game:** the neighborhood hub (street), as the recurring
   rival; also abstractly as a teal-green figure in the Community Crossing cutscene.
4. **Why it is inadequate:** Dex is a **key character** but currently reads as a
   recolor of the player — a tinted clone undermines his distinct identity. Flagged
   #1 in `asset_upgrade_queue.md`.
5. **Replacement target:** a **unique Dex character sheet** — a cocky BMX kid,
   distinct silhouette from Zuzu, slightly cocky posture (hands-in-pockets / lean).
   4-direction, ~96×96 to match existing NPC sheets.
6. **Style constraints (from style bible):** pixel-JRPG / anime-adjacent; warm
   palette with a **teal accent** (his signature, #5fc6d8/#4ad0b0); readable
   silhouette; large expressive head; **no photorealism, no cel-anime, no style
   drift**; same scale/density as Mr. Chen/Ramirez/Zuzu sheets.
7. **Proposed workflow:** Aseprite (primary) authoring — OR ComfyUI+SDXL concept with
   a locked anime-pixel LoRA + prompt template + fixed seed, then Aseprite cleanup to
   the sheet grid. Workflow order: Concept → style validation → generation →
   consistency review → human review → production.
8. **Expected benefit:** Dex becomes visually his own character; the rival arc and
   the Community Crossing land harder. High character-impact.
9. **Risk:** off-style generation; scale/grid mismatch breaks the sheet. Mitigation:
   match `ACT1_CHARACTER_ANIMATION_SHEETS` frame size exactly; review before swap.
10. **Validation plan:** swap `sheetKey`/remove tint in NeighborhoodScene + Crossing;
    `npm run build`; smoke 1/1; visual capture of the neighborhood + crossing;
    confirm animation plays and silhouette is distinct from Zuzu.
11. **Human review requirement:** **REQUIRED.** Do not replace the live sprite until
    a human approves the candidate or explicitly waives review.
