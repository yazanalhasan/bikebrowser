# Replacement Proposal — Community Crossing Backdrop (Priority 2)

1. **Current asset:** the crossing backdrop — `ASSET_KEYS.washCrossingBackdrop`, a
   **procedurally-drawn Phaser texture** (`createSceneContextBackdrops` in
   AssetRegistry.js), shown at 560×150 in CrossingScene.
2. **Current location:** generated in `src/game/phaser/systems/AssetRegistry.js`
   (procedural); consumed in `src/game/phaser/scenes/CrossingScene.js`.
3. **Where it appears in game:** behind **The Community Crossing Sequence** — now the
   **emotional climax of Act 1**.
4. **Why it is inadequate:** the climax deserves the strongest visual presentation;
   the current backdrop is a clean-placeholder procedural panel — functional but flat,
   without the warmth/lighting of the Tier-1 painted backgrounds.
5. **Replacement target:** a **painted pixel backdrop** of the repaired wash crossing
   at warm golden-hour light — saguaro silhouettes, the deck reading clearly, the two
   neighborhoods connected, a sense of community gathering. Aligns with the Tier-1
   `desert_sky_dusk` standard.
6. **Style constraints:** pixel-JRPG, warm Sonoran palette (golds/ambers/clays),
   directional golden light, soft shadows, readable bridge deck, **community warmth**;
   no photorealism / cel-anime; match the 560×150 display footprint.
7. **Proposed workflow:** prefer **porting/adapting a Tier-1 painted background**
   (`BikeBrowserWorld/Assets/Backgrounds/*`) to the crossing framing; OR
   ComfyUI+SDXL (locked style) → Aseprite cleanup. Concept → validation → generation
   → consistency review → human review → production.
8. **Expected benefit:** the emotional payoff gets a visual payoff; staging
   (figures crossing the deck) reads against a warm, intentional scene.
9. **Risk:** scale/letterboxing mismatch with the panel; over-busy background
   competing with the character figures. Mitigation: keep midground simple so the
   figures + text remain legible; review composition.
10. **Validation plan:** swap the backdrop key/image; `npm run build`; run the
    crossing validation (14 beats complete + zuzu_crossing unlock); visual capture of
    each scene; confirm figures + text remain readable.
11. **Human review requirement:** **REQUIRED.** Do not replace the runtime background
    without review (composition/legibility is a judgment call).
