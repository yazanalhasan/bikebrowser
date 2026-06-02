# REBUILD Runtime Audit — `/game-rebuild` (Phase 2)

**Route:** http://127.0.0.1:5173/game-rebuild
**Code:** `src/game/` (GameShell.jsx → `phaser/` scenes + `data/act1/` + `phaser/systems/`)
**Method:** Evidence-based, runtime-first. Driven with Playwright
(`tests/e2e/legacy-vs-rebuild.audit.spec.js`), corroborated by the prior verified acceptance run
(`playtest_captures/game_rebuild_act1_acceptance/`) and the prior audit
(`artifacts/game_state/runtime_reality_audit.md`). Reality > docs.
**Date:** 2026-06-02

---

## TL;DR — Is the rebuild playable?

**Yes, and it is the more polished of the two.** It boots clean, runs the **entire Act-1 happy path
end-to-end with zero failures and zero console/page errors**, and presents a cohesive painterly
single-screen neighborhood with four animated characters, a working notebook, GPS minimap, and a
state-driven HUD. Its limitation is **scope**: Act 1 is essentially the whole game — one screen,
no second area, no enterable buildings. Verified this pass: all 8 flow steps `ok: true`
(`rebuild_runtime.json`).

---

## 1. Boot sequence (verified this pass)

- Navigating to `/game-rebuild` sets `window.BIKEBROWSER_READY === true`, `window.__GAME__`, and
  `window.__bikebrowserRebuildGame`; canvas visible. **No "Start" click required** (boots straight
  into gameplay, unlike legacy). Evidence: `rebuild_00_start.png`, `rebuild_runtime.json`.
- Scene graph at boot: `BootScene` → `PreloadScene` → then **`NeighborhoodScene` active** with
  overlay scenes **`QuestScene`, `DialogueScene`, `DebugScene`, `WorldMapScene`** all launched.
  `NeighborhoodScene` carries **226 child objects** (vs legacy garage's 70) — the single screen is
  dense. Evidence: `rebuild_runtime.json` scenes/activeScenes.
- **Zero console errors** captured during boot + full playthrough.

---

## 2. What a player can do (verified flow)

Drove the canonical Act-1 chain via the runtime API; **every step succeeded** (`rebuild_runtime.json`
`flow`):

| Step | Result | Evidence |
|---|---|---|
| `bike_check` | ✅ | `rebuild_01_bike_check.png` |
| `dry_wash` (discover wash/bridge) | ✅ | `rebuild_02_dry_wash.png` |
| `collect_materials` | ✅ | — |
| `test_materials` (mesquite/steel/copper/scrap UTM) | ✅ | `rebuild_03_material_tests.png` |
| `bridge_plan` (tested_triangle_plan) | ✅ | — |
| `repair_bridge` | ✅ | `rebuild_04_bridge_repaired_map.png` |
| `unlock_map` (gated on bridgeReconnected) | ✅ | `rebuild_04` |
| `open_notebook` | ✅ | `rebuild_05_notebook.png` |

The complete interactive surface is the **13 walk-up-and-press-E zones** in
`NeighborhoodScene.createInteractions()` (bike, Mr. Chen, Mrs. Ramirez, dry_wash, materials_table,
ecology_patch, utm, chemistry_station, bridge_plan, bridge_repair, spanish_neighbor, arabic_mentor,
wider_gate) — confirmed unchanged from the prior audit. Movement = WASD/arrows; E/Space = interact;
G = GPS; N = notebook; R = replay voice; M = quiet (help bar in every screenshot).

---

## 3. Visible systems (verified)

- **4 animated NPCs/characters** rendered with final Aseprite art: Zuzu (player), **Mr. Chen,
  Mrs. Ramirez, Auntie Mariam** — labeled and standing on the street. Evidence: `rebuild_00_start.png`.
- **Quest HUD** "Today's trail" + "Bike Check: Ask Mr. Chen what happened near the wash" (top-left),
  and a **"Current clue"** evidence box (bottom-right) that updates with progression.
- **Zuzu GPS minimap** (bottom-left) showing route nodes; after bridge repair it expands to
  "6/8 known | 8 unlocked" with Salt River / Copper Mine / City Gate nodes and updates to
  **"Wider map unlocked. A larger systems mystery is waiting."** Evidence: `rebuild_04`.
- **Field Notebook** (N) — "Zuzu's Field Notebook 10/16 clues", multi-card learning artifact.
  Evidence: `rebuild_05_notebook.png`.
- **State-driven landmarks**: "broken wash"/"dry wash path" become "safe crossing"/"repaired
  crossing"/"the neighborhood path" after repair. Evidence: `rebuild_00` vs `rebuild_04`.
- **UTM / MaterialsLab, Construction/Bridge, Chemistry, Ecology, Trust, Language** systems all fire
  (per the flow above + prior acceptance run).

---

## 4. Dead ends / placeholders (carried from verified prior audit, still true)

- **No second area.** `WorldMapScene` is launched as an overlay but renders nothing visible; Salt
  River / Copper Mine exist only as GPS labels. **Act 1 is the entire playable game.**
- **No enterable buildings** (garage/home/school are background art + GPS nodes only).
- **No quest gating** — zones fire whenever you press E; only `unlockWiderMap()` is truly gated
  (on `bridgeReconnected`).
- **No economy** — no currency/inventory UI (legacy has Zuzubucks + Items; rebuild does not).
- **NPC dialogue is one-and-done**, static scripted lines (no branching, no adaptive difficulty).
- **Environment art is partly placeholder** — many props fall back to hand-drawn Phaser Graphics
  primitives; props carry debug-style text tags ("garage/workbench", "materials table",
  "compare bend"). Characters, however, are final animated art.

---

## 5. One-line reality summary

`/game-rebuild` is a **polished, error-free, single-screen educational vignette** — the full Act-1
loop (bike → wash → materials → UTM → chemistry → ecology → bridge plan → repair → trust → wider-map
tease) runs end-to-end in ~1.5 min with four animated characters, a real field-notebook, and a
state-reactive HUD/landmark system. It is **shallower than the legacy** (one screen vs ~15 scenes,
no economy, no second biome) but **tighter, more cohesive, and more readable**.
