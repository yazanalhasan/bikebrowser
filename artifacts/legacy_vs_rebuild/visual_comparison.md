# Visual Comparison — LEGACY vs REBUILD (Phase 3)

**Compared routes:** `/legacy-play` (`src/renderer/game/`) vs `/game-rebuild` (`src/game/`)
**Method:** Side-by-side of live Playwright screenshots captured this pass under
`playtest_captures/legacy_vs_rebuild/`. Scoring per category: **Legacy Wins / Rebuild Wins / Tie**,
each grounded in named screenshots. Reality > docs.
**Date:** 2026-06-02

**Key evidence files**
- Legacy: `legacy_10_garage_dialogued.png`, `legacy_11_OverworldScene.png`,
  `legacy_12_WorldMapScene.png`, `legacy_13_MaterialLabScene.png`, `legacy_15_DryWashScene.png`,
  `legacy_16_CopperMineScene.png`, `legacy_19_LakeEdgeScene.png`, `legacy_25_StreetBlockScene.png`
- Rebuild: `rebuild_00_start.png`, `rebuild_03_material_tests.png`,
  `rebuild_04_bridge_repaired_map.png`, `rebuild_05_notebook.png`

---

## Category scores

| # | Category | Verdict | Why (evidence) |
|---|---|---|---|
| 1 | **Environment art / cohesion** | **Rebuild Wins** | Rebuild is a single, intentional painterly biome — paved road + dirt shoulders + layered Sonoran hills, consistent palette (`rebuild_00`). Legacy mixes flat tan tilemaps (garage `legacy_10`), blocky low-poly biomes (`legacy_15`, `legacy_19`), and emoji-decor scenes (`legacy_16`, `legacy_25`) — broader but visually inconsistent scene-to-scene. |
| 2 | **Scene readability** | **Rebuild Wins** | Rebuild reads at a glance: one screen, clearly separated road/landmarks/NPCs (`rebuild_00`). Legacy's busiest scenes get crowded and HUD toasts occlude the world — StreetBlock has the "heat" toast + "2 quests here" banner stacked over the houses (`legacy_25`). |
| 3 | **Clutter / HUD discipline** | **Rebuild Wins** | Rebuild HUD is compact and corner-anchored (trail top-left, clue bottom-right, GPS bottom-left) (`rebuild_00`). Legacy stacks a persistent "No active mission" panel + heat warning + "You arrived!" banners that overlap the playfield in nearly every scene (`legacy_11`–`legacy_25`). |
| 4 | **NPC quality** | **Rebuild Wins** | Rebuild NPCs are detailed, animated Aseprite characters (Mr. Chen, Mrs. Ramirez, Auntie Mariam) with distinct silhouettes (`rebuild_00`). Legacy NPCs are simpler blocky "3D-ish" figures (red-cap Zuzu, generic worker bodies) that read as placeholder-grade by comparison (`legacy_16`, `legacy_19`, `legacy_25`). |
| 5 | **Biome quality / variety** | **Legacy Wins** | Legacy offers many distinct biomes that each render real content: desert+mountains (`legacy_15`), 3-band lake (`legacy_19`), mine interior (`legacy_16`), foraging desert, mountain, salt river, dog park, pool, sports fields. Rebuild has exactly **one** biome. Legacy wins on variety; rebuild wins per-scene fidelity — but the category is breadth, so Legacy. |
| 6 | **Atmosphere** | **Tie** | Rebuild has stronger mood lighting/cohesion on its one screen (`rebuild_00`). Legacy lands genuine atmosphere in specific scenes — the hazy layered mesas of DryWash (`legacy_15`) and the water gradient of LakeEdge (`legacy_19`) — but flat/clinical in the garage and labs. Even: depth vs consistency. |
| 7 | **Visual storytelling** | **Rebuild Wins** | Rebuild tells the story *visually through state*: the broken wash → "safe crossing"/"repaired crossing" and the GPS unlocking new nodes after repair (`rebuild_00` vs `rebuild_04`); diegetic clue text drives the eye. Legacy storytelling leans on text dialogue boxes and warning toasts rather than environmental change (`legacy_13`, `legacy_25`). |
| 8 | **Landmark visibility** | **Tie** | Rebuild labels landmarks crisply in-world ("broken wash", "dry wash path", "materials table", "safe crossing") and on the GPS (`rebuild_00`, `rebuild_04`). Legacy also labels heavily (Workbench, Materials/Thermal Lab, Fishing Spot, Cave Entrance, Surface Copper) (`legacy_10`, `legacy_19`, `legacy_16`) — but legacy labels are denser and sometimes collide with HUD. Roughly even. |
| 9 | **Navigation clarity** | **Legacy Wins (intent) / Rebuild Wins (execution)** → **net Tie** | Legacy *communicates* navigation better: explicit doors ("Go Outside ⬇", "Descend ⬇", "Leave Pool ⬇"), an overworld node map (`legacy_11`) and a world-map fast-travel hub (`legacy_12`) — a real sense of "places to go." BUT execution is broken: the WorldMap renders half-empty (`legacy_12`) and overworld reachability is order-sensitive. Rebuild is trivially navigable because it's **one screen** — clear, but only because there is nowhere else to go. Net: Tie. |
| 10 | **Interactive-system presentation (labs)** | **Legacy Wins** | Legacy's **MaterialLab UTM** is a richer dedicated screen: sample list, rendered testing machine, a real STRESS-vs-STRAIN chart with axes, START TEST, density slider (`legacy_13`); the ThermalRig shows α coefficients + live ΔL (`legacy_14`). Rebuild's UTM is a smaller inline visualizer on the same street (`rebuild_03`). For lab presentation, legacy is more "instrument-like." |

---

## Tally

- **Rebuild Wins:** 5 (environment cohesion, readability, clutter, NPC quality, visual storytelling)
- **Legacy Wins:** 3 (biome variety, lab-instrument presentation, navigation *intent*)
- **Tie:** 3 (atmosphere, landmark visibility, navigation net)

> (Category 9 counted once as net Tie; sub-verdicts shown for transparency.)

---

## Synthesis

**The two builds win on opposite axes.** The **rebuild wins the "looks like a finished, coherent
game" axis** — one tight painterly screen, clearly readable, four genuinely animated characters, a
disciplined HUD, and storytelling that plays out through environmental state changes. The **legacy
wins the "there is a whole world here" axis** — ~15 distinct biomes/locations, instrument-grade
science labs (UTM with a real stress-strain chart, thermal rig with α values), an overworld + world
map, and an inventory/Zuzubucks economy — but it pays for that breadth with inconsistent art (flat
tilemaps + blocky NPCs + emoji decor side by side), HUD clutter that occludes the playfield, and
half-wired navigation (empty world map, order-sensitive scene transitions).

**Bottom line:** if the question is *visual polish and readability on what's actually shown*, the
**rebuild wins**. If the question is *visual richness, variety, and depth of content*, the
**legacy wins**. Neither is a global winner; they are different bets — a small polished slice vs a
large rough world.
