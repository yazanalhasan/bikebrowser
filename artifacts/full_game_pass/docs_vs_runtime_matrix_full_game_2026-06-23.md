# Docs vs Runtime Matrix — Full Game (7 Chapters)

_Regenerated 2026-06-23 from code reconnaissance of `src/` (8 parallel explorers, one
per chapter + one cross-chapter). Supersedes the Act-1-only `docs_vs_runtime_matrix.md`
(2026-06-02). Verdicts grounded in `file:line` evidence._

Dimensions per system: **Documented** (design exists) · **Implemented** (real code, not a
stub) · **Wired** (reachable in the running game) · **Playable** (a player can complete the
loop through normal play). ✅ yes · ⚠️ partial · ❌ no.

## Headline

The game is **far past the Jun-2 Act-1 snapshot**. All **19 R3F apparatus labs** are registered
in `GameShell.jsx` and all **15 bench scenes** are trigger-wired; every chapter's **engineering
rig and biology lab is fully implemented, wired, and playable** (real physics models +
predict→test→result loops). The chapter **unlock chain works** end-to-end (Ch N complete →
Ch N+1 unlocked, navigable via the Vehicle Ladder / `ChapterMapScene`).

Three systematic gaps repeat in **every** chapter 2–7, and one cross-cutting bug affects all:

1. **No real vehicle build.** Each chapter's "🏍 BUILD THE …" button only *emits an event*
   (`circuit:built`, `engine:built`, …) that marks the chapter complete. No vehicle object is
   assembled, owned, or ridden. The rig is the chapter.
2. **No navigable region.** Every chapter's `region`/`reach` (e.g. "first regional roads",
   "ocean & coastal", "alien planet") is **label-only** — `NeighborhoodScene` (Sonoran Desert)
   is still the only overworld. The "vehicle = key that gates map reach" spine (arc.md §5) is
   not realized past Act 1.
3. **Biology labs don't gate progression.** `phyto/cell/ferment/mech/eco:built` fire feedback
   only; **only the vehicle `:built` event marks a chapter complete** (`NeighborhoodScene.js:1364-1417`).
4. **🔴 Progression is not persisted across reloads.** `SaveSystem` stores only
   `bikebrowser.gameRebuild.act1`; the `progression` registry value (`chaptersComplete`) is set
   in `NeighborhoodScene.js:1445` but never written to localStorage and never restored at boot.
   A page refresh re-locks Chapters 2–7.

## Per-chapter matrix

| Ch | Vehicle | Eng. rig | Rig status (Doc/Impl/Wired/Play) | Biology lab | Bio status | Vehicle build | Region | →Next unlock |
|----|---------|----------|----------------------------------|-------------|-----------|---------------|--------|--------------|
| 1 | Bike | UTM + Bridge + LoadTest + Skate | ✅✅✅✅ (Skate ⚠️ no reasoning quests) | Ecology | ✅✅✅✅ | ✅ repair/bridge real | ✅ Sonoran Desert navigable | ✅ `loadTest:done`→Ch2 |
| 2 | E-bike | Circuit Bench | ✅✅✅✅ | Ethnobotany (Extraction) | ✅✅✅✅ | ❌ event-only (`circuit:built`) | ❌ label-only | ✅ →Ch3 |
| 3 | Motorcycle | Engine Dyno | ✅✅✅✅ | Phytochemistry (Phyto) | ✅✅✅✅ | ❌ event-only (`engine:built`) | ❌ label-only | ✅ →Ch4 |
| 4 | Car | Crash / Load | ✅✅✅✅ | Cellular (Microscope) | ✅✅✅✅ | ❌ event-only (`crash:built`) | ❌ label-only | ✅ →Ch5 (Act 2) |
| 5 | Boat | Hydro Tank (buoyancy) | ✅✅✅✅ | Microbiology (Ferment) | ✅✅✅✅ | ❌ event-only (`boat:built`) | ❌ ocean label-only | ✅ →Ch6 |
| 6 | Plane | Wind Tunnel | ✅✅✅✅ | Molecular (Mechanism) | ✅✅✅✅ | ❌ event-only (`plane:built`) | ❌ intercontinental label-only | ✅ →Ch7 |
| 7 | Spacecraft | Vacuum / Re-entry | ✅✅✅✅ | Systems Bio (Ecosystem) | ✅✅✅✅ | ❌ event-only (`space:built`) | ❌ alien planet label-only | ⚠️ no game-end / victory state |

## Cross-cutting systems

| System | Implemented | Wired | Playable | Notes |
|--------|-------------|-------|----------|-------|
| ChapterProgressionSystem | ✅ | ✅ | ✅ | `isUnlocked(n) = completed.has(n-1)`; Vehicle Ladder navigable |
| Vehicle Ladder / ChapterMapScene | ✅ | ✅ | ✅ | Select & enter any unlocked chapter; fires entry event |
| Notebook | ✅ | ✅ | ✅ | Unlock/view pipeline; carry-forward metadata |
| Quests | ✅ | ✅ | ✅ | Ordering + completion tracking |
| Dialogue / NPCs | ✅ | ✅ | ✅ | Branching choices; Piper + WebSpeech voice routing |
| Trust | ✅ | ✅ | ⚠️ | Tracked, but "shops/mentors" sink absent |
| Language | ✅ | ✅ | ⚠️ | Records phrases; Act 2–7 scaling not implemented |
| Discovery map / registry | ✅ | ✅ | ✅ | Act 1 only; 8-category persistent registry |
| Voice / audio | ✅ | ✅ | ✅ | Piper server + WebSpeech fallback |
| Economy (Zuzubucks) | ⚠️ | ⚠️ | ❌ | Currency awarded; **no shop / sink / trade** |
| **Save / progression persistence** | ⚠️ | ⚠️ | ❌ | **Act1 state saved; `chaptersComplete` NOT persisted → lost on reload** |

## Priority fixes (in order)

1. **🔴 Persist `progression` to localStorage** (load at boot, write on `_markChapterComplete`).
   One-file fix; without it the whole 7-chapter spine resets every refresh. (`SaveSystem.js`,
   `PreloadScene.js`, `NeighborhoodScene.js:1440`.)
2. **Pick the vehicle-build doctrine.** Either (a) build real vehicle objects + at least one
   navigable region per chapter so "vehicle = reach key" holds, or (b) formally redefine the
   upper chapters as rig-sandbox chapters and update arc.md. Affects Ch2–7 identically.
3. **Ch7 game-end state** — no victory/finale when the ladder completes (`space:built`); add an
   ending + require the ecosystem stewardship gate (arc.md §3 Act 3).
4. **Ch1 Skate Park reasoning quests** — physics sandbox works but `SkateParkSystem.quests` is
   unpopulated, so the predict→test loop has no pedagogical spine.
