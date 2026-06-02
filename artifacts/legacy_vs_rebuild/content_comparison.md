# Content Comparison (Phase 6) — Legacy vs Rebuild

**Audit date:** 2026-06-02 · **Method:** counted/read real data files in both trees. Reality > docs.
**Scope:** quests, NPCs, dialogue, locations/scenes, datasets, lore, notebook content.
**LEGACY** = `src/renderer/game/` (`/legacy-play`) · **REBUILD** = `src/game/phaser/` + `src/game/data/act1/` (`/game-rebuild`, live).

---

## Headline counts

| Content type | LEGACY | REBUILD | File evidence |
|---|---|---|---|
| Main quests (code) | **21** | **11** | `data/quests.js` (21 top-level keys) vs `data/act1/act1Quests.js:1-122` (11) |
| Quest objectives/steps | ~120+ steps | **32 objectives** | per-quest `steps[]` vs `act1Quests.js` |
| Side / board quests | 23 board entries | 0 (chain is the content) | `data/questBoard.js` |
| Language quests | 27 | 0 (greetings inline) | `data/languageQuests.js` |
| Cognitive quests | 10 | 0 | `data/cognitiveQuests/arizonaCognitiveQuests.js` |
| **Total authored quests** | **~54+** | **11** | — |
| NPC profiles | 6 detailed (`npcProfiles.js`) + many dialogue-template NPCs | **6** | `data/npcProfiles.js:1-105` vs `act1Characters.js:1-8` |
| Dialogue (LOC) | **815** (templates+profiles) | **13 entries** | `npcDialogueTemplates.js`(469)+`dialogueTemplates.js`(241)+`npcProfiles.js`(105) vs `act1Dialogue.js` |
| Playable scenes | **18 registry / 24 files** | **1** (+6 thin) | `systems/sceneRegistry.js:27-377` vs `NeighborhoodScene.js` |
| Named locations | 18 scenes across 6+ biomes | **11 anchors in 1 scene** | `sceneRegistry.js` vs `act1Locations.js:1-13` |
| Flora species | **12** | 3 (mesquite/creosote/saguaro) | `data/flora.js` (12 `name:`) vs `act1Ecology.js:1-6` |
| Fauna species | **9** | 0 | `data/fauna.js` (9 `name:`) vs — |
| Materials (testable) | dozens (parts+materials) | **4** | `materials.js`/`bikeParts.js`/`ebikeParts.js` vs `act1Materials.js:1-62` |
| Recipes | crafting recipes (`recipes.js` 176 LOC) | **2** chemistry | `data/recipes.js` vs `act1Chemistry.js:1-4` |
| Languages | **6 regions** w/ vocabulary DB | **2** (Spanish, Arabic) inline | `data/languages.js` (REGIONS) vs `act1Dialogue.js` |
| Notebook entries | knowledge-concept driven (`knowledgeConcepts.js`) | **16** authored | `act1NotebookEntries.js:1-16` |

---

## 1. Quests — count + quality

**Legacy: ~54 authored quests, high per-quest authoring, no spine.**
- **21 main quests** (`quests.js`, 1690 LOC): `flat_tire_repair`, `chain_repair`, `desert_healer`,
  `food_chain_tracker`, `desert_survival`, `medicine_balance`, `extract_dna`, `engineer_bacteria`,
  `bio_battery_integration`, `the_living_fluid`, `desert_infection`, `one_sided_forest`,
  `toxic_knowledge`, `invisible_map`, `bridge_collapse`, `heat_failure`, `perfect_composite`,
  `boat_puzzle`, `engine_cleaning`, `desert_coating`, `understand_expression`.
- Each is genuinely deep: typed steps (`dialogue|inspect|use_item|quiz|explainer|complete`),
  `learningGoal`, multi-panel `presentation[]` lectures (e.g. `bridge_collapse.triangle_bridge_lesson`
  is a 4-slide bridge-engineering lesson + 4-choice quiz, `quests.js`), and structured `reward
  {items,xp,zuzubucks,reputation}`. Spans bike repair, materials, chemistry, ecology, genetics,
  pharmacology.
- Plus **23 quest-board entries** (`questBoard.js`, includes `locked_ebike`/`locked_factory`),
  **27 language quests** (`languageQuests.js`), and **10 cognitive deduction puzzles**
  (`arizonaCognitiveQuests.js`: "The Silent Leak", "Scorching Pavement Timing", "Water Logic",
  "Bridge Load Logic", "Navigation Without Map", etc., each `{prompt, options[], correct, feedback}`).
- **Quality verdict:** individually well-written and pedagogically ambitious, but **fragmented** —
  standalone, reputation-gated, no authored arc; prior audits flag much as off-path/unwired.

**Rebuild: 11 quests / 32 objectives, lower volume, fully coherent + wired.**
- One linear chain (`act1Quests.js:1-122`): Bike Check → Wash Problem → Find Materials → Test
  Materials → Bridge Plan → Reconnect Crossing → Desert Helper → Mix/Dry/Test → Neighborhood Trust →
  First Wider Map, each linked by `next`. Every objective is completed by a real scene interaction
  and several carry honest failure gates (see gameplay report §8).
- **Quality verdict:** thinner and largely linear/one-shot; ~13 "walk-to-halo, press E"
  interactions, and several objectives are bundle-completed by one handler (e.g. `collect_materials`
  finishes 3 objectives at once — `Act1RuntimeSystem.js:159-164`). Quest 7 `desert_helper` is
  **Partial**: `observe_creosote`/`observe_saguaro` have data but no wired zone
  (`act1Quests.js:81-85` vs handlers `:166-171`). But it is the **only complete-able, reachable arc**.

**Score: Legacy wins on count + per-quest depth; Rebuild wins on coherence + reachability.** For raw
content quantity → **Legacy**.

## 2. NPCs

**Legacy:** 6 deeply-modeled profiles (`npcProfiles.js`: `mrs_ramirez`, `mr_chen`, `old_miner`,
`desert_guide`, `river_biologist` + more) plus an NPC **language/trust behavior engine**
(`npcLanguageSystem.js`, 339 LOC) defining personality archetypes — `gentle_explainer`,
`practical_trader`, `strict_elder`, `playful_child`, `technical_craftsperson` — each with
`localTermFrequency`, `correctsMistakes`, `patienceLevel`, `teachingRate` (`:24-60`). NPCs adapt
dialogue to player language mastery and gate prices/quests on trust.

**Rebuild:** 6 authored characters with clear roles and bilingual profiles (`act1Characters.js:1-8`):
Zuzu (player), Mr. Chen (garage mentor), Mrs. Ramirez (Spanish neighbor), Auntie Mariam (Arabic
mentor), Desert Helper Sign, Local Trader — each with `languageProfile`, `trustState`, `dialogueSets`,
`notebookHooks`, `questHooks`. Four have **final Aseprite art** (`runtime_reality_audit.md:183`).

**Score: Tie on count (6 vs 6); Legacy wins on behavioral modeling, Rebuild wins on production
polish (final art, every NPC wired into the live chain).** → **Tie**, lean Legacy for depth.

## 3. Dialogue

**Legacy: 815 LOC** of dialogue — `npcDialogueTemplates.js` (469), `dialogueTemplates.js` (241),
`npcProfiles.js` (105) — plus `dialogueDifficulty.js` (118 LOC adaptive banding) and
`phraseBuilder.js`/`phraseTemplates.js`. Volume + adaptivity, but template-generated and partly
unreachable.

**Rebuild: 13 hand-authored dialogue entries** (`act1Dialogue.js`), each with `voiceId`, `languageTag`,
`emotion`, `pacing`, `speechEnabled`, multi-line `lines[]`, and gameplay effects (`completes`,
`notebook`, `inventory`, `trust`, `language`). Tightly written, voice-acting-ready, and **every line
fires real state** via `applyDialogueEffects` (`Act1RuntimeSystem.js:117-135`).

**Score: Legacy wins on raw volume; Rebuild wins on craft + integration.** For quantity → **Legacy**;
for shipped quality → **Rebuild**. Net **Tie**.

## 4. Locations / scenes

**Legacy:** 18 registered scenes (24 files) across **6+ distinct biomes** — neighborhood, lakeside,
fields, pool, desert, mountain, mine, river — with exits/spawns/unlock gates (`sceneRegistry.js`).
A real explorable world.

**Rebuild:** **1 playable scene** (`NeighborhoodScene.js`, 1586 LOC) containing 11 location anchors
(`act1Locations.js`); the other 6 scene files are boot/preload/dialogue/quest/worldmap shells
(5-84 LOC each). No biome variety, no scene exits.

**Score: Legacy wins decisively** on locations/scenes/biomes.

## 5. Datasets

**Legacy: large, scientifically-modeled tables.**
- Flora: **12 species** with unified ecology+pharmacology+science+foraging models
  (`flora.js`: creosote with `pharmacology{antiInflammatory,antimicrobial,toxicity}`,
  `scienceInteractions{}`, `foraging{maturityDays}` — `:14-60`).
- Fauna: **9 species** with elevation, diet, activity, predator/prey flags (`fauna.js`: javelina
  requires mesquite+prickly_pear — `:14-28`).
- Ecology relations (`ecology.js`, PLANT_ECOLOGY + PREDATOR_CHAINS), parts (`bikeParts`/`ebikeParts`/
  `batteryParts` = 510 LOC), `materials.js`, `recipes.js`, `languages.js` (6-region vocabulary),
  `knowledgeConcepts.js`. A simulation-grade content library.

**Rebuild: small, purpose-built, all consumed.**
- 4 materials with full property vectors used by the UTM (`act1Materials.js:1-62`: density,
  tensile/compressive strength, elasticity, brittleness, thermal/corrosion, cost, `bridgeUsefulness`,
  `childReadableDescription`).
- 4 ecology entries (`act1Ecology.js`: heat/water/habitat/harvestEthic), 2 chemistry recipes
  (`act1Chemistry.js`). Every datum is read by a live system; nothing orphaned.

**Score: Legacy wins on dataset breadth + scientific richness.** Rebuild's data is minimal but 100%
wired. → **Legacy** for content depth.

## 6. Lore & language

**Legacy:** A 6-region language model (`languages.js` REGIONS: Andes/Quechua+Spanish,
Levant/Arabic, etc.) with native script, transliteration, pronunciation, difficulty tiers, mastery
thresholds, and gameplay-linked vocabulary — "language is a gameplay system, not cosmetic text"
(`languages.js:1-40`). Plus ethnobotany/Sonoran lore (`data/sonoran/`, `ethnobotany/`), curriculum
docs, and milestone lore (`milestones.js`). Deep but much is content/design, partly unwired.

**Rebuild:** Lore is focused and **relationship-based, not a quiz**: bilingual greetings used
naturally (Spanish "Gracias", Arabic "Ahlan, welcome") tied to trust gains
(`act1Dialogue.js` `spanish_trust`/`arabic_welcome` with `trust{neighbor:1}`/`{arabic_mentor:1}`),
desert harvest ethics ("the desert is not a parts bin… observe first, take little, leave habitat" —
`ecology_helper`), and a sequel-hook map clue (spacecraft frame). Narrow, warm, and reachable.

**Score: Legacy wins on lore breadth + linguistic depth; Rebuild wins on tone and integration.** For
content volume → **Legacy**.

## 7. Notebook content

**Legacy:** No single authored field-notebook; "notebook" content is the knowledge-concept system
(`knowledgeSystem.js` + `knowledgeConcepts.js` + `discoveryUnlocks.js`) — concepts unlock as you
discover species/finish lessons. Systemic, not a curated booklet.

**Rebuild:** **16 hand-authored notebook entries** (`act1NotebookEntries.js:1-16`) across categories
Bike/Observation/Construction/Material/Test Result/Ecology/Chemistry/Language/Trust/Map, each a
concise child-readable note (e.g. "The UTM made differences visible: stiffness, strength, brittleness,
and usefulness are not the same thing"). The Field Notebook (13/16 clues reachable) is the rebuild's
**signature content artifact** and a visible progress meter.

**Score: Rebuild wins** — a curated, reachable, well-written field notebook is its standout content.

---

## Summary

By **quantity**, Legacy dominates almost everything: ~54 authored quests vs 11, 18 scenes / 6+ biomes
vs 1, 12 flora + 9 fauna vs 3 + 0, 815 LOC of dialogue vs 13 entries, a 6-region language model with a
mastery system vs 2 inline greetings, and a simulation-grade dataset library — but a large share is
fragmented, template-generated, or unwired/off-path. The **Rebuild** ships far less content (4
materials, 11 quests, 16 notebook entries, 1 scene) yet every datum is hand-authored, integrated,
voice-ready, and reachable, with two genuine quality standouts the legacy lacks: a curated **16-entry
Field Notebook** and **relationship-based bilingual dialogue** wired to a trust system. **Per-subsystem
content scores: Legacy wins quests-by-volume, scenes/locations, datasets, NPC behavioral depth, and
lore breadth; Rebuild wins notebook content and dialogue craft/integration; NPCs and dialogue-by-
quality net to ties.** Legacy is the bigger *content library*; Rebuild is the better-*finished*
content slice.
