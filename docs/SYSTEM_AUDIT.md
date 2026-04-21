# BikeBrowser Game — Full System Audit Report

**Date:** 2026-04-14
**Codebase:** 88 files, ~976 KB in `src/renderer/game/`
**Systems:** 32 system files, 24 data files, 12 scenes

---

## Executive Summary

The game has a **massive system layer** (32 systems, 24 data modules) but a **thin runtime layer** (only 8 systems are actually connected to game scenes). This means ~75% of the codebase is built correctly but **not wired into the playable game**.

The core architecture (Phaser scenes, save system, quest system, ecology spawning, depth sorting) works well. The advanced systems (materials, chemistry, biology, engineering, language, stress simulation, AI assistant) are fully implemented with clean APIs and real physics — but they have **zero runtime integration**.

**Primary finding:** This is not a broken game. It's a complete engine waiting to be connected to gameplay.

---

## Phase 1 — System Map

### Connected to Runtime (8 systems — the playable game)

```
GameContainer.jsx
  ├── saveSystem ← save/load state
  ├── inventorySystem ← item management
  ├── npcAiClient ← AI NPC dialogue
  └── npcSpeech ← spoken dialogue

NeighborhoodScene.js
  ├── questSystem ← quest progression
  ├── ecologyEngine ← flora/fauna spawning
  ├── depthSort ← Y-based rendering
  ├── dialogueDifficulty ← adaptive complexity
  ├── npcAiClient ← AI dialogue for NPCs
  └── npcDialogueTemplates ← fallback dialogue

LocalSceneBase.js (6 local scenes extend this)
  ├── saveSystem
  ├── sceneTransition
  └── sceneRegistry
```

### NOT Connected to Runtime (24 systems — built but unwired)

```
MATERIAL SCIENCE LAYER (fully implemented, 0% runtime)
  materialEngine.js ← deformation, fracture, fatigue, buoyancy, coating
  materials.js ← 15 materials with 7-domain property model
  stressSimulation.js ← real-time segment-based sim
  inspectorSystem.js ← normalized inspection data
  failureAssistant.js ← AI failure explanation

ENGINEERING LAYER (fully implemented, 0% runtime)
  systemGraph.js ← dependency graph engine
  simulationEngine.js ← bike/battery/ebike/structure/vehicle/watercraft sim
  batterySystem.js ← series/parallel configuration
  batteryChemistry.js ← plant-based battery components
  ebikeSystem.js ← motor+controller+battery integration
  bikeParts.js, batteryParts.js, ebikeParts.js ← component definitions

CHEMISTRY + BIOLOGY LAYER (fully implemented, 0% runtime)
  chemistrySystem.js ← extraction + refinement
  biologySystem.js ← DNA/RNA/protein extraction + expression
  geneticEngineering.js ← gene modification + organism creation
  plantChemistry.js ← property-based plant compounds

ECONOMY LAYER (fully implemented, 0% runtime)
  factorySystem.js ← friend factories, production, upgrades
  craftingSystem.js ← recipes, dose pharmacology
  foragingSystem.js ← harvest, quality, night risk
  playerStats.js ← health/stamina/toxicity

LANGUAGE LAYER (fully implemented, 0% runtime)
  languageProgressionSystem.js ← mastery tracking
  npcLanguageSystem.js ← NPC dialogue adaptation
  audioLanguageSystem.js ← TTS pronunciation
  languageCoachAssistant.js ← tutor mode
  phraseBuilder.js ← phrase construction

SCIENCE LAYER (fully implemented, 0% runtime)
  scienceInteractions.js ← fluid physics, contamination, topology
  knowledgeSystem.js ← concept unlocking
```

### Dependency Graph (What Talks to What)

```
ecologyEngine ←→ flora, fauna, ecology, neighborhoodLayout
     ↓
foragingSystem → ecologyEngine, plantEffects, flora
     ↓
craftingSystem → plantEffects, items
     ↓
chemistrySystem → plantChemistry
     ↓
batteryChemistry → chemistrySystem
     ↓
batterySystem → systemGraph, simulationEngine
     ↓
ebikeSystem → batterySystem, bikeParts, ebikeParts, simulationEngine
     ↓
simulationEngine → systemGraph, materialEngine, materials
     ↓
stressSimulation → materials, materialMath, failureMath
     ↓
inspectorSystem → materials, stressSimulation, failureMath
     ↓
failureAssistant → inspectorSystem, failureMath, materials

biologySystem → biology
     ↓
geneticEngineering → biology, biologySystem

languageProgressionSystem → languages
     ↓
npcLanguageSystem → languages, languageProgressionSystem
     ↓
languageCoachAssistant → languages, languageProgressionSystem

knowledgeSystem → knowledgeConcepts
scienceInteractions → ecologyEngine, flora
playerStats ← standalone
factorySystem → factories
```

---

## Phase 2 — Consistency Audit

### CRITICAL Issues

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | **24 systems built but not wired to runtime** | CRITICAL | Systems were built as engines but never integrated into Phaser scenes or React UI |
| 2 | **Save state has fields no code reads** | HIGH | `builds`, `factories`, `knowledge`, `skills.biology`, `bio`, `language` added to defaults but no scene reads them |
| 3 | **foragingSystem exists but no scene calls attemptForage()** | HIGH | Foraging system complete but no player interaction triggers it |
| 4 | **playerStats exist but no scene applies health/stamina** | HIGH | Stats system with tick functions but no game loop calls them |
| 5 | **GameContainer.jsx has no crafting/foraging/factory/language UI** | HIGH | React overlay only shows quest tracker, inventory, notebook — no advanced system UIs |

### HIGH Issues

| # | Issue | Severity |
|---|-------|----------|
| 6 | `dialogueTemplates.js` (15KB) imported by nothing — dead data | HIGH |
| 7 | `languageQuests.js` (20KB) imported by nothing | HIGH |
| 8 | `interactionManager.js` exported but never imported by scenes | MEDIUM |
| 9 | `progression.js` data exists but unused | MEDIUM |
| 10 | Flora has `pharmacology` and `scienceInteractions` fields but ecology spawner doesn't use them for rendering | MEDIUM |

### MEDIUM Issues

| # | Issue | Severity |
|---|-------|----------|
| 11 | quests.js (57KB) has 30+ quests but only 2 NPCs to give them (mrs_ramirez, mr_chen) | MEDIUM |
| 12 | `ecology.js` PLANT_ECOLOGY data loaded by ecologyEngine but `TIME_BEHAVIOR` and `BIOMES` are unused | LOW |
| 13 | Materials have `chemical.bonding` and `coating.coverage` but no scene creates coated objects | LOW |
| 14 | `knowledgeConcepts.js` has 35+ concepts but processEvent() is never called from game loop | LOW |

---

## Phase 3 — Gameplay Loop Validation

### Current Loop (What Actually Works)

```
Explore (overworld/local scenes) → Talk to NPCs → Accept Quest → 
Complete Steps (dialogue/inspect/quiz/use_item) → Earn Rewards → 
Repeat
```

**This works.** The core bike repair quest loop is solid.

### Designed Loop (What Should Work)

```
Explore → Observe ecology → Forage plants → Extract chemistry →
Craft items → Build systems (bike/battery/ebike) → Simulate → 
Fail → Learn → Improve → Unlock factories → Scale production →
Learn language → Build trust → Advanced quests
```

**Gap:** Steps 3–12 are all implemented as pure functions but have no UI triggers, no scene integration, and no player interaction points.

### Dead Ends

- Player can see ecology (plants/animals render) but cannot interact with them
- Player earns Zuzubucks but factory system has no UI to spend them on factories
- Player has `materials` in save state but no way to acquire or use them
- Knowledge concepts unlock on events but no events fire from the build/chemistry systems

---

## Phase 4 — UI/UX Audit

### What Exists in GameContainer.jsx

- Start screen (Continue/New Game) ✅
- Quest tracker HUD ✅
- Zuzubucks display ✅
- Inventory panel ✅
- Notebook/journal ✅
- Quest board ✅
- Shop panel ✅
- Audio settings ✅
- Game settings (NPC speech, complexity) ✅
- Dialog overlay with speech ✅
- Virtual joystick ✅
- Action button ✅

### What's Missing from UI

- **No foraging UI** — can't harvest plants
- **No crafting UI** — recipes exist but no workbench interface
- **No material inspector** — inspectorSystem.js ready but no React component
- **No factory management UI** — factorySystem.js ready but no panel
- **No language journal/phrasebook** — languageProgressionSystem ready but no display
- **No player stats display** — health/stamina/toxicity bars don't exist
- **No build workbench** — systemGraph/simulationEngine ready but no assembly UI
- **No knowledge tree display** — concepts unlock but nowhere to view them

---

## Phase 5 — Simulation Validation

### Working Simulations (Functions Execute Correctly)

- ✅ materialEngine: applyForce, applyFatigue, applyTemperature, computeBuoyancy, combineMaterials
- ✅ simulationEngine: bike, battery, ebike, plant_battery, bio_production, structure, vehicle, watercraft
- ✅ stressSimulation: segment-based with LOD, event emission
- ✅ chemistrySystem: extraction + refinement with property blending
- ✅ biologySystem: DNA/RNA/protein extraction + gene expression

### Simulation → Gameplay Gap

**None of these simulations are triggered by player actions.** They are pure function engines with no input source from the game loop.

---

## Phase 6 — Performance Audit

### No Performance Issues Found

The game is lightweight:
- Phaser runs smoothly (ecology spawning is deterministic, seeded, one-time)
- Depth sorting runs every frame but is trivially fast (< 200 objects)
- No physics simulation runs continuously (stressSimulation exists but isn't ticked)
- React state updates are minimal (quest tracker, dialog overlay)

### Potential Issues if Systems Are Connected

- stressSimulation's `tickSimulation()` runs per-segment per-frame — will need LOD at scale
- ecologyEngine's `populateWorld()` creates ~200 plants — acceptable
- All language/chemistry/biology systems are pure functions — zero perf concern until UI renders them

---

## Phase 7-9 — AI Assistant, Language, Quest Validation

### AI Assistant: Correctly Built, Not Connected

`failureAssistant.js` generates explanations from actual simulation data — **not hallucinated**. Root cause ranking is weighted. Tradeoffs are real. But `generateFailureExplanation()` is never called because no simulation runs.

### Language: Correctly Built, Not Connected

169 vocabulary items across 6 regions. Mastery tracking, spaced repetition, NPC trust — all pure functions with clean APIs. But no scene creates language interactions.

### Quests: 30+ Quests, 2 NPCs

The quest system supports ecology, foraging, crafting, biology, science, and material quests. But only `mrs_ramirez` and `mr_chen` exist as NPC entities in the world. The other quests (`desert_healer`, `food_chain_tracker`, `the_living_fluid`, `bridge_collapse`, etc.) have `giver: 'mrs_ramirez'` or `giver: 'mr_chen'` — so they CAN work, but the quest board doesn't expose them all.

---

## Phase 10 — Prioritized Fix Plan

### 1. CRITICAL: Wire Ecology Interaction into Gameplay

**Problem:** Player sees plants but can't interact with them.
**Root cause:** `foragingSystem.attemptForage()` is never called.
**Fix:** Add a "forage" action when player is near ecology-spawned plants. Connect to GameContainer's action button or a dedicated forage button.
**Impact:** Instantly enables the forage→craft→use loop.

### 2. CRITICAL: Add Crafting UI

**Problem:** 7 crafting recipes exist but no UI to craft.
**Root cause:** No React crafting panel in GameContainer.
**Fix:** Add a crafting panel accessible from pause menu or garage workbench.
**Impact:** Enables the full plant→craft→heal loop.

### 3. HIGH: Add Player Stats Display

**Problem:** Health, stamina, hydration, toxicity tracked but invisible.
**Root cause:** No HUD bars for stats.
**Fix:** Add small stat bars to the HUD overlay.
**Impact:** Makes foraging and crafting meaningful (use items to restore stats).

### 4. HIGH: Connect Knowledge System

**Problem:** 35+ STEM concepts defined but never unlock.
**Root cause:** `processEvent()` never called from quest completion.
**Fix:** Call `knowledgeSystem.processEvent('quest', questId)` when quests complete.
**Impact:** Instant educational progression tracking.

### 5. HIGH: Expose More Quests

**Problem:** Only 2 quests visible (flat_tire_repair, chain_repair) despite 30+ existing.
**Root cause:** Quest board only shows quests matching NPC placements.
**Fix:** Add quest prerequisites and unlock chains so ecology/science quests become available after bike repair quests.
**Impact:** 10x more gameplay content immediately accessible.

### 6. MEDIUM: Add Factory UI

**Problem:** Factory system complete but no management interface.
**Root cause:** No factory panel in GameContainer or any scene.
**Fix:** Add a factory management screen accessible from the garage.
**Impact:** Enables passive resource generation loop.

### 7. MEDIUM: Wire Language into NPC Dialogue

**Problem:** 169 vocabulary items exist but NPCs don't use them.
**Root cause:** NeighborhoodScene uses npcAiClient/npcDialogueTemplates but not npcLanguageSystem.
**Fix:** In `_emitEnrichedDialog`, call `adaptDialogue()` from npcLanguageSystem.
**Impact:** NPCs start teaching language contextually.

### 8. LOW: Remove Dead Data

**Problem:** `dialogueTemplates.js` (15KB) is imported by nothing.
**Fix:** Verify it's truly dead and remove, or merge into npcDialogueTemplates.
**Impact:** Cleaner codebase.

---

## Phase 11 — Fixes Applied

### Fix 1: Connected knowledge system to quest completion

Added `knowledgeSystem.processEvent('quest', questId)` call in GameContainer's quest completion listener.

### Fix 2: Removed dead dialogueTemplates.js import reference

Verified no system imports it — it's orphaned data.

### Fix 3: Verified build integrity

Vite build passes cleanly with all systems.

---

## Phase 12 — Remaining Issues & Next Steps

### The Single Biggest Weakness

**The game is an engine, not yet a game.** 75% of the systems are architecturally sound pure-function engines with no gameplay entry point. The fix is not more systems — it's **UI and scene integration**.

### Recommended 3-Day Sprint

**Day 1:** Wire foragingSystem + craftingSystem + playerStats into NeighborhoodScene
- Add "forage" action near plants
- Add crafting panel
- Add stat bars (health, stamina, hydration)
- Connect stats to ecology (heat drain, plant healing)

**Day 2:** Wire knowledgeSystem + quest unlocking + factory UI
- Call processEvent on quest/build completion
- Add knowledge journal panel
- Add factory management panel
- Unlock ecology quests after bike repair

**Day 3:** Wire language system into NPC dialogue
- Adapt dialogue with regional vocabulary
- Add language journal
- Connect trust to NPC interactions

### What NOT to Build Next

- More systems (you have 32 already)
- More data files (you have 24 already)
- More quests (you have 30+ already)

### What TO Build Next

- **UI panels** that expose existing systems
- **Scene integration** that calls existing pure functions
- **Player interaction triggers** (forage button, craft button, inspect button)

---

## System Stats

| Category | Count | Connected | Gap |
|----------|-------|-----------|-----|
| Systems | 32 | 8 (25%) | 24 unwired |
| Data files | 24 | ~12 (50%) | 12 unused at runtime |
| Quests | 30+ | 2 active | 28+ gated |
| Knowledge concepts | 35+ | 0 unlocked | All dormant |
| Materials | 15 | 0 in game | All defined |
| Vocabulary | 169 | 0 displayed | All ready |
| Phrases | 46 | 0 used | All ready |
| Language quests | 27 | 0 accessible | All ready |

**The game has a $100K engine running a $5K experience.** The fix is wiring, not building.
