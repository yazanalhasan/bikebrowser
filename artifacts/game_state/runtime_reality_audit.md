# BikeBrowser — Runtime Reality Audit (Phase 2)

**Method:** Evidence-based, runtime-first. Reality > design docs. Live dev server confirmed UP
(`http://127.0.0.1:5173/game-rebuild` → HTTP 200). Primary evidence = the verified PASS-run
screenshots in `playtest_captures/game_rebuild_act1_acceptance/` plus the actual game-rebuild
scene/system code under `src/game/phaser/`. Where code exists but is not reachable at runtime,
**runtime wins** and it is flagged as a dead end / placeholder.

**Date:** 2026-06-02

---

## 0. CRITICAL ARCHITECTURE FINDING — which codebase is live

There are **two parallel game codebases** in the repo:

- `src/renderer/game/scenes/` — an OLDER Phaser world (OverworldScene, WorldMapScene 74KB,
  DryWashScene with a real click-to-place bridge-construction minigame, GarageScene, MountainScene,
  CopperMineScene, ~20 scenes). This is **NOT what `/game-rebuild` loads.**
- `src/game/phaser/` — the **game-rebuild**, the thing actually served at `/game-rebuild` and
  driven by `tests/e2e/game-rebuild.act1-acceptance.spec.js`. **This is the runtime reality.**

The ~20 scenes in `src/renderer/game/scenes/` (and the construction-puzzle DryWashScene) are
**not reachable** from `/game-rebuild`. The verified acceptance run plays entirely inside ONE
scene of the rebuild: `src/game/phaser/scenes/NeighborhoodScene.js`.

> Implication: any claim that BikeBrowser has "~20 scenes" or a "place-each-beam bridge build"
> describes the *legacy* codebase, not what a player loads today.

---

## 1. What a player can ACTUALLY do today

The live experience is a **single-screen, side-on Arizona neighborhood street** (world 1600×1000,
camera follows Zuzu). Everything in Act 1 happens here. The player:

- **Moves** Zuzu with WASD / arrow keys (smoothed velocity, 4-direction walk/idle animation from
  `zuzu` Aseprite sheet). Evidence: `00_start.png` (Zuzu mid-street), `NeighborhoodScene.update()`
  lines 1122-1132.
- **Walks up to a glowing teal halo / interaction zone**; a yellow `[E] <label>` prompt appears
  above it (`update()` 1134-1143). Evidence: every screenshot shows the `[E] …` prompt, e.g.
  `01_bike_check.png` → "[E] Inspect the bike", `07_utm_tests.png` → "[E] Run UTM material tests".
- **Presses E** to trigger the zone's `action` (game logic) and/or `dialogueId` (a talking-head
  dialogue panel). Evidence: `02_mr_chen_dialogue.png` shows the bottom dialogue box
  "Mr. Chen — Morning, Zuzu. The wash bridge is closed after the flood."
- **Reads feedback** — a toast (top-left), an "evidence panel" / Current-clue box (bottom-right),
  and a Zuzu-GPS HUD (bottom-left). Evidence: `09_bridge_repaired.png` bottom-right
  "Bridge repaired: Zuzu tested, built, crossed…".
- **Opens the Field Notebook** (N key) — a 3-tab paper panel (Clues / Tests / Map) listing unlocked
  entries. Evidence: `11_final_notebook_completion.png` → "Zuzu's Field Notebook 13/16 clues".
- **Opens the GPS map** (G key) — expands the bottom-left HUD into a route diagram. Evidence:
  `09_bridge_repaired.png` shows the expanded GPS with nodes (Garage, Salt River, Copper Mine,
  Dry Wash, City Gate) and "5/8 known | 5 unlocked".
- **Replays last voice line (R), toggles quiet audio (M).** Help bar bottom of every screenshot:
  "WASD / arrows move • E or Space explore • G GPS • N notebook • R replay voice • M quiet".

### The 13 interactable zones (the entire interactive surface)
From `NeighborhoodScene.createInteractions()` (lines 669-767):

| Zone id | Prompt | Effect (runtime) |
|---|---|---|
| `bike` | Inspect the bike | `bike_check` → notebook `bike_check`, toast "Bike check complete" |
| `mr_chen` | Talk to Mr. Chen | dialogue only (`mr_chen_bridge_intro`) |
| `neighbor` | Ask Mrs. Ramirez | dialogue (`wash_neighbor`) |
| `dry_wash` | Read bridge sign | `dry_wash` → discovers wash+bridge, notebook entries |
| `materials_table` | Collect candidate materials | adds steel/copper/scrap to inventory |
| `ecology_patch` | Observe desert helpers | adds mesquite, ecology observation |
| `utm` | Run UTM material tests | tests all 4 materials, animates UTM rig |
| `chemistry_station` | Mix, dry, test | runs sealant recipe |
| `bridge_plan` | Plan bridge repair | accepts the (hardcoded) tested plan |
| `bridge_repair` | Reconnect the crossing | repairs bridge, swaps sprite, celebration FX |
| `spanish_neighbor` | Thank Mrs. Ramirez | Spanish trust dialogue, +trust |
| `arabic_mentor` | Check in with Auntie Mariam | Arabic welcome dialogue, +trust |
| `wider_gate` | Open wider map clue | sets `act1Complete`, "wider map" tease |

That is the **complete** set of things a player can interact with. There is no inventory UI to open,
no combat, no shop transaction, no free-form building.

---

## 2. Quests that exist in runtime

A 10-quest chain is authored in `src/game/data/act1/act1Quests.js` and tracked by `QuestSystem`:
Bike Check → Something's Wrong at the Wash → Find What Could Fix It → Test Before You Trust →
Bridge Plan → Reconnect the Crossing → Desert Helper → Mix/Dry/Test → Neighborhood Trust →
First Wider Map.

The **active objective** is surfaced as the top-left "Today's trail" banner (QuestScene, launched
as an overlay). Evidence: `01_bike_check.png` "Today's trail — Bike Check: Ask Mr. Chen…";
`07_utm_tests.png` "Bridge Plan: Choose a deck material." It updates as you complete steps.

**Runtime caveat (important):** objectives are *tracked and displayed* but **not enforced**. Any
interaction zone fires its action whenever you stand on it and press E — there is no lock requiring
you to finish quest N before doing N+1 (`update()` simply calls
`runtime.handleInteraction(nearest.action)`; no step-gate). The only real gate is
`unlockWiderMap()`, which refuses unless `bridge.bridgeReconnected` is true
(`Act1RuntimeSystem.unlockWiderMap`, lines 276-289).

---

## 3. Systems that are visible / active

Eleven runtime systems are instantiated and bound to the registry by `Act1RuntimeSystem`
(lines 36-69): Quest, Notebook, Inventory, Bike, MaterialsLab (UTM), Construction, Ecology,
Chemistry, Trust, Language, DiscoveryMap. **Player-visible** evidence of each:

- **MaterialsLab / UTM** — a live "test load" visualizer with a sample that flexes/bends and three
  comparison bars (`createUtmVisualizer`, `updateUtmVisualizer`). Evidence: `07_utm_tests.png`
  bottom-right "Weak Scrap: comparison failure. Evidence added."
- **Construction / Bridge** — the broken-bridge sprite swaps to a repaired sprite + glow + "the
  neighborhood path changed" banner. Evidence: `09_bridge_repaired.png` ("repaired crossing",
  "safe crossing").
- **Notebook** — 3-tab panel, "13/16 clues", star marks new entries. Evidence:
  `11_final_notebook_completion.png`.
- **DiscoveryMap / GPS** — route map HUD with locked vs unlocked nodes. Evidence:
  `09_bridge_repaired.png`, `10_wider_map_unlocked.png`.
- **Trust + Language** — dialogue with Mrs. Ramirez ("Gracias") and Auntie Mariam ("Ahlan");
  notebook Language/Trust entries. (Voice/TTS via Act1AudioSystem; acceptance run logged 0 speech
  attempts in headless, so audio is wired but unverified in that capture — `report.json`
  `audioSummary.speechAttempts: 0`.)
- **Chemistry** — a faint steam/drying-patch visualizer that brightens after the recipe runs
  (`createChemistryVisualizer` / `updateEmbodiedWorldFeedback`). Evidence: `06_chemistry_station.png`.
- **Ecology** — an "observe first" patch that updates label state as you observe.

---

## 4. Educational systems that are active

All grounded in authored, age-appropriate content (not lorem-ipsum):

- **Engineering / materials science** — the UTM "test before you trust" loop. `act1Materials`
  carry real properties (tensileStrength, brittleness, elasticity, bridgeUsefulness); the test
  reports strength bands and a child-readable tactile cue (`MaterialsLabSystem.testMaterial`).
- **The notebook as a learning artifact** — 16 authored field-note entries spanning Bike,
  Observation, Construction, Material, Test Result, Ecology, Chemistry, Language, Trust, Map
  (`act1NotebookEntries.js`). e.g. "stiffness, strength, brittleness, and usefulness are not the
  same thing."
- **Ecology ethic** — "Observe first. Take little. Leave habitat." (`ecology_helper` dialogue).
- **Chemistry** — "Mixing, concentration, drying, and heat change whether a repair compound works."
- **Heritage language exposure** — Spanish (Mrs. Ramirez) and Arabic (Auntie Mariam) used
  *naturally in relationship*, explicitly "not as a quiz" (`arabic_interaction` notebook body).
- **Difficulty banding / adaptive dialogue** exists in the *legacy* NeighborhoodScene
  (`computeDifficultyBand`, AI dialogue enrichment) but the **game-rebuild dialogue is static**
  scripted lines (`act1Dialogue.js` + `DialogueScene`); no adaptive difficulty in the live build.

---

## 5. Progression that exists

Linear, one-act progression measured by notebook unlocks + objective completion. The acceptance
run ends with `act1Complete: true`, `bridgeReconnected: true`, `widerMapUnlocked: true`, 13/16
notebook entries, 4 material tests (`report.json`). Visible progression markers:
notebook count climbs ("13/16 clues"), GPS "places mapped" climbs ("3 places mapped" → "6 places
mapped" across `00→09`), broken bridge becomes repaired bridge. **Zuzubucks/currency exists only in
the legacy scene** (+25 Zuzubucks reward) — there is **no currency or reward economy in the
game-rebuild runtime**.

---

## 6. DEAD ENDS (runtime-confirmed)

- **The "wider map" is a tease, not a place.** `wider_gate` sets `act1Complete` and shows
  "Wider map unlocked. A larger systems mystery is waiting." (`10_wider_map_unlocked.png`).
  `WorldMapScene.js` is an **empty stub** (a class with no `create()` — renders nothing). Salt River
  and Copper Mine appear only as **locked dots/labels on the GPS HUD**
  (`getWorldMapLocations` → `locked: true`); there is no scene to travel to. **Act 1 is the entire
  playable game today.**
- **Garage / home / school** appear as discovered GPS nodes and as background art (school node
  sprite at 292,692; "Zuzu home" house) but are **not enterable** — no garage interior scene in the
  rebuild (the legacy `GarageScene`/`ZuzuGarageScene` are unreachable).
- **NPC dialogue is one-and-done.** Re-pressing E on Mr. Chen just replays the same intro line
  (DialogueSystem restarts the same `dialogueId`); no branching, no follow-up conversation tree.
- **No exits.** Unlike the legacy scenes (which had `addExit`/edge-sensor transitions to other
  scenes), the rebuild NeighborhoodScene has **no scene transitions at all** — you cannot leave the
  street.

---

## 7. PLACEHOLDER content (runtime-confirmed)

- **Art has a placeholder fallback chain.** Most props/characters resolve through
  `provenancedTextureOrFallback` / `canUseFinalPropAsset` / `canUseWave1Asset` →
  `drawLegacy…Fallback`. Characters (Zuzu, Chen, Ramirez, Mariam) DO have final Aseprite sheets and
  animate (passed the character-art audit). Environment (mountains, road, homes) frequently falls
  back to **hand-drawn Phaser Graphics primitives** when provenanced assets aren't present
  (`drawLegacySonoranVistaFallback`, `drawLegacyRoadSystemFallback`,
  `drawLegacySouthwestHomes`). Evidence: the flat, geometric mountains/houses/road visible in every
  screenshot are the legacy-graphics fallback, not finished painted art. There is an explicit
  `?forcePlaceholderProps` switch (`forcePlaceholderPropAssets`).
- **Props are labeled with debug-style text tags** in the world: "garage/workbench", "materials
  table", "compare bend", "test first", "flood line", "broken wash", "dry wash path". Evidence:
  visible across `02`–`08`. These read as developer scaffolding, not diegetic signage.
- **An asset contract / placeholder registry** (`PLACEHOLDER_ASSET_CONTRACT`) is shipped, confirming
  the team treats current assets as provisional.
- **WorldMapScene** (empty), **DebugScene**, **QuestScene** are all launched as overlays at boot
  (`PreloadScene` lines 24-27); WorldMapScene contributes nothing visible.

---

## 8. One-line reality summary

Today, `/game-rebuild` is a **single-screen, walk-up-and-press-E educational vignette** that takes a
verified ~1.5 minutes to complete Act 1 end-to-end (bike → wash → materials → UTM test → chemistry →
ecology → bridge plan → repair → trust → wider-map tease), with a real field-notebook learning
artifact, four animated characters, and a working UTM/bridge feedback loop — but **no second area,
no enterable buildings, no enforced quest gating, no economy, and a large amount of placeholder
geometric environment art.** The "~20 scenes" and the click-to-build bridge puzzle live in a
**separate legacy codebase that the live build does not load.**
