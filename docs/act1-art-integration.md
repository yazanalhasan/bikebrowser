# Act 1 art integration

Replaces the Act 1 placeholder art — emoji stand-ins, flat colour fills and one
missing texture — with the delivered production art, and adds the two new
Act 1 characters, Mariam and Lina.

Companion documents:

| File | What it is |
| --- | --- |
| `docs/act1-art-manifest.json` | The delivered manifest. 200 entries over 150 PNGs, each with its target path, origin, provenance and QA score. |
| `docs/act1-art-style-guide.md` | The style guide the art was made to. |
| `docs/act1-art-reused-assets.md` | The 117 reused assets and where each came from. |
| `docs/act1-art-screens/` | One screenshot per Act 1 scene, captured from the running game. |

---

## Asset Provenance

**117 reused, 83 generated, over 150 PNG files.**

- **Reused (117).** Curated pixel art that already existed on the unmerged
  branch `eb/p0-defect-sweep@a0d706d`, listed file-by-file in
  `docs/act1-art-reused-assets.md`. That branch is **not** merged and is not an
  ancestor of this one — the copies came from the delivered bundle, so nothing
  else from it rides along.
- **Generated (83).** New art made for this pass to the style guide, including
  the four Mariam/Lina character sheets.

Counts are asserted by `tests/act1-art-registry.test.mjs`, which reads the
manifest, so they cannot drift from the files on disk.

### Weak spots to redo later

Known-soft art that works today but deserves a second pass:

| Asset | Why |
| --- | --- |
| Zuzu-on-bike idle frame (`zuzu.png#zuzu_bike_idle`) | Single pose, painterly-HD source downsampled into the 96x110 cell. QA score 3, the lowest in the bundle. It is also the only atlas frame that fills its cell top to bottom. |
| Sports court tile (`act1.grounds.sportsfields_court`) | Built by repeating a plain court-green strip. Faint seams, and it reads as grass rather than hardcourt. A hand-authored court with painted lines would be better. QA score 3. |
| The "3" on the dog's collar tag (`act1.items.dog_collar`) | The tag carries a numeral, which the style guide forbids inside sprites ("No text, letters or logos"). Harmless at play size; repaint the tag blank. |
| Mirrored side frames for Lina and Mariam | The left/right rows are mirrors of one another, so hair partings and the backpack flip sides as they turn. Zuzu's sheets have the same property. Hand-drawn side frames would fix it. |

### GenerateImage sourcing

The 83 generated assets came from **Grok Bot GenerateImage**, which is **not on
the Executive Brain approved-source list**. Per the style guide, generated art
stays "reference" until EB curates and registers it
(`asset_provenance_policy`). **These assets still need Executive Brain review
and registration.** Per-asset provenance — tool, prompt summary, reference
images, raw file and post-processing — is recorded in
`docs/act1-art-manifest.json` under each entry's `provenance` key.

No GPU or ComfyUI work was involved in this integration; the art arrived
pre-rendered in the bundle.

---

## How the art is wired

Scenes never name a file. They name an **art slot**, and the slot resolves to a
texture key through a generated registry. Re-cutting art is then a data change,
which is what `arc.md` §4 asks for ("visual tokens come from data so the
licensed-asset import dispatch can swap tokens without code changes") and what
§8.6 protects (no primitive fragmentation).

```
docs/act1-art-manifest.json          the delivered provenance record
  └─ scripts/generate-act1-art-registry.mjs
       └─ src/game/assets/act1ArtRegistry.js   GENERATED — slot → key → path
            ├─ src/game/assets/assetManifest.js   what the loader fetches
            └─ src/game/assets/act1Art.js         addArt / addGround / addBackdrop
                 └─ LocalSceneBase.addProp(...)   what scenes call
```

Regenerate with `node scripts/generate-act1-art-registry.mjs`.

- **Preload.** `LocalSceneBase.preload()` loads the whole Act 1 set, so every
  local scene and sub-scene inherits it; `OverworldScene` and `WorldMapScene`
  extend `Phaser.Scene` directly and call `preloadGameAssets` themselves. Loads
  are idempotent, so scene transitions do not re-fetch.
- **Atlases.** `zuzu.png` (23 frames) and `neighborhood.png` (22) were present
  on disk but only ever loaded by `StreetBlockScene`. They now load everywhere,
  and all 45 frames are used: Zuzu's walk/idle rows, the Mr Chen and Mrs
  Ramirez portraits, the three house facades, the plant and animal frames, both
  bikes, the GPS post and the garage signpost.
- **Tileset.** The 8-tile Sonoran tileset was in the manifest but never loaded —
  `preloadGameAssets` skipped the `tilesets` group entirely. It now loads as a
  spritesheet and builds the overworld ground.
- **Anchors.** Props anchor on their base line (origin `0.5, 1`), icons centre
  on their point, tiles repeat, backdrops stretch. The anchor comes from the
  asset's role in the registry, not from the call site.
- **Pixel-perfect.** `pixelArt: true` and `roundPixels: true` are set on the
  Phaser config, so textures are not bilinear-filtered and sprites sit on whole
  pixels. Scale defaults to 1 — the art is authored at its on-screen size — and
  when a layout asks for a different size the helper snaps the scale to a clean
  fraction so pixels stay square.
- **Characters.** Zuzu, Mariam and Lina all draw at one shared scale
  (`CHARACTER_PIXEL_SCALE` in `src/game/art/artConfig.js`) and all anchor on
  their sheet's own feet baseline, so relative heights are the artist's
  decision and every character in a scene stands on the same line.

---

## Zero placeholders in Act 1

Every emoji **sprite**, flat-colour ground and placeholder fill in the Act 1
scenes is now real art. What remains, deliberately:

- **Scene captions and UI text.** Scene titles ("🏜️ Desert Trail"), the
  "Interact"/"Enter" prompts, the world-map legend and the quest-count badges
  are typography, not art. The bundle supplies no asset for them, and the style
  guide explicitly leaves lettering to the UI: "No text, letters or logos
  inside sprites. Signs are blank; the UI draws labels."
- **Architectural primitives with no asset.** Park and pool fences, park
  benches, the lake dock, the mine's timber supports, garage windows and the
  obstacle hazard bands are still drawn with shapes. The manifest has no
  entry for any of them.

Both groups are listed in the handover notes at the end of this document.

---

## Mariam and Lina

**Mariam** (`mariam`) is the Act 1 Levantine Arabic mentor: a grown-up
neighbour in her own front yard on Zuzu's street, placed with the same pattern
as Mrs. Ramirez. She is a mentor, not a quest-giver — talking to her teaches
one of three Arabic words and changes nothing else. She uses only
`characters/mariam_idle.png` and `characters/mariam_talk.png` from this bundle;
no older "Arabic mentor" art is referenced anywhere.

**Lina** (`lina`) is Zuzu's kid companion. She is on the street the first time
he steps outside, and once they have met she follows him through the
neighbourhood and the desert scenes. She is not a second player and not a
quest-giver: she walks behind Zuzu, and talking to her returns a short line.
She is mounted by `systems/companionSystem.js` from `data/companions.js`, so
adding a later companion is a data row.

**Dr. Maya** (`river_biologist`) is untouched — same name, same art, same role.

### Language cards

`systems/languageLayer.js` previously held three English placeholders
(`placeholder_hello` / `_water` / `_repair`, each `languageSlot: 'und'`, each
reading "[needs a human language brief]"). They are now Mariam's three
Levantine Arabic cards, `languageSlot: 'ar'`, copied verbatim from
`bb-briefs/levantine-arabic.md`:

| id | script | transliteration | English |
| --- | --- | --- | --- |
| `ar_hello` | مرحبا | mar7aba | hello |
| `ar_water` | مي | mayy | water |
| `ar_fix` | صلّح | salli7 | repair |

Each card carries the full line Mariam speaks, the kid transliteration and a
short English caption. Script, transliteration and caption are all shown
together — the brief's rule is that rank 1 never hides the script. The cards
appear in Zuzu's notebook in `GameContainer.jsx` under "Words Mariam taught",
with the Arabic set `dir="rtl"`, and practice counts come from
`state.languagePractice`. The old placeholder ids still resolve, so saved
practice is not lost.

**Scope held deliberately.** `tests/act1-progress.test.mjs` asserts these
limits so they cannot be widened by accident:

- Exactly these three terms. The brief's wider 21-term starter deck is **not**
  added to `data/languages.js`.
- No Spanish cards, and no new Spanish vocabulary. Lina's one Spanish line
  ("¡Vamos, Zuzu!") is the line the Spanish brief marks decided.
- The existing MSA-leaning `ar_*` entries in `data/languages.js` are **not**
  rewritten — brief questions 1, 2 and 4 are still open.
- No Indigenous lore was added or changed.
- No `cultural:` knowledge ids are marked from the language layer.

---

## Fixes this pass needed

Four problems blocked the art from being seen correctly. All were found by
playing the game, not by reading it.

1. **The letterbox frame covered the room.** `LocalSceneBase._renderViewportFrame`
   computed its biome bands from `cam.scrollX`, which does not account for
   Phaser centring the view when the viewport is wider than the world. The left
   band was drawn hundreds of pixels too wide and painted over the west side of
   every small scene — in the garage it hid the entire workbench wall, tools,
   beaker, thermometer and spare wheels. Now derived from `cam.worldView`.
   *This was pre-existing, not introduced here.*
2. **Props rendered on top of the player.** Props were being given depths from
   the `artConfig.DEPTHS` bands (props = 160) while the local scenes sort in the
   10–49 band from `systems/depthSort.js`, and the player was pinned at a fixed
   depth 6. Zuzu disappeared behind bikes and plants. `groundDepth()` now
   returns a value in the scenes' own band and the player y-sorts into it.
3. **Four ground textures tiled with visible gaps.** `drywash_ground`,
   `drywash_bank`, `saltriver_water` and the ecology `dry_wash` tile ship with a
   2–7px transparent border, so repeating them drew a grid of dark seams. The
   generator now measures each tile's opaque bounds and records the trim, and
   `addGround` tiles the cropped region. Worth knowing if these plates are
   re-cut: a tiling texture must be opaque to its edge.
4. **The overworld had no map.** `OverworldScene` loaded
   `game/maps/neighborhood_world_v1.png`, which has never existed in the repo,
   and rendered a missing texture. The bundle contains no painted overworld
   plate, so the ground is now built from the 8-tile Sonoran tileset — sand
   base, grass blocks, road cross and kerbs — with the geometry in
   `public/layouts/overworld.layout.json`.

---

## Verification

- `node --test tests/*.test.mjs` — 65 tests, all passing (57 pre-existing plus
  8 new art-integrity tests).
- `npm run build` — clean; only the pre-existing chunk-size warnings.
- `runRuntimeAudit` reports **PASS, 0 errors, 0 warnings** at boot, and no
  `[act1Art] texture ... is not loaded` error appears in the console for any
  scene. That error is deliberately loud: a missing Act 1 texture means a
  placeholder has come back.
- All 16 Act 1 scenes were opened in the running game and photographed into
  `docs/act1-art-screens/`.

`tests/act1-art-registry.test.mjs` is the standing gate. It fails if an asset
is deleted or moved, if a PNG is re-cut without regenerating the registry, if
an atlas frame name drifts from its JSON, if the character sheets stop being
4x4 of 96px frames with feet on y=91, if a declared preload path does not
resolve, or if two texture keys collide.

---

## Handover notes

Things a human should decide, with nothing silently assumed:

1. **Jojoba Extract has no dedicated asset.** The manifest covers four of the
   five Desert Foraging resources. The fifth now shows the creosote-resin vial,
   which reads correctly as a jar of plant extract but is not unique. A
   dedicated asset would be better.
2. **Three deliberate art reuses**, all because the bundle has no dedicated
   asset: the garage's spare wheels use the bike-wheel art cut for the map
   icon; the green and yellow background houses reuse the Ramirez and Zuzu
   facades; and the pool/mountain/pond grass reuses the Lake Edge grass tile.
3. **The garage interior art is dark** (mean luma ≈81 against the flat grey it
   replaced at ≈184). That is the delivered art's own value, not a wiring
   artefact, and it is the first room a child sees. Worth a look.
4. **No assets exist for** fences, benches, the lake dock, mine timbers,
   garage windows or obstacle hazard bands. They remain drawn with shapes.
5. **`travelIconArt` is data-only.** The manifest's `map_travel_bike` slot is
   recorded next to the existing `travelIcon` field in `worldMapData.js`, but
   nothing renders travel icons yet, so the asset is registered and unused.
6. **A "Coming soon!" line survives** in `WorldMapScene` for a map node whose
   scene class is not registered. It is a defensive fallback for a
   data/code mismatch, not placeholder art, and it never fires today.
