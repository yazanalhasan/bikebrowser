# BikeBrowser End-to-End Audit & Completion Pass (Executive Brain, 2026-07-06)

Directive: full audit against `arc.md`, then make the game genuinely complete —
**no stubs, no fake-outs; every quest completable and playable; every scene
looks and behaves correctly**; verified by real play (Claude-in-Chrome) and the
full validation suite.

## How the audit ran

- EB capability probe audit (41 capabilities exercised, 25 governance-blocked,
  3 failed) → `Documents/executive-brain/artifacts/capability_audit/`.
- Very-thorough code audit of the `/game-rebuild` runtime: quest inventory,
  scene inventory, stub/fake-out sweep, chapter/progression wiring, test entry
  points (agent report, headlines below).
- Repo's own strict trigger-graph audit + build + 124 unit tests + 128-spec
  Playwright e2e suite.

## What the audit found (ranked)

1. **Biology spine (Ch 2–7) player-unreachable** — the bio-lab doors lived on
   Phaser bench scenes that GameShell hides under the React lab overlays; e2e
   fired the events directly, so tests passed without reachability.
2. **Two parallel implementations per station** — Phaser bench scenes (rich,
   e2e-tested) shadowed by React labs (player-visible); the UTM prediction gate
   and the 5-role truss designer were bypassed by the R3F switch, breaking the
   acceptance contracts ("prediction precedes intervention", fail→iterate
   teaching).
3. **ExtractionLab reported success unconditionally** (no SUITABLE gate).
4. **Side quests completed silently** — never surfaced as visible quests.
5. **Esc force-completed dialogue objectives** (open + Esc = quest-critical talk
   "done" without reading).
6. **Batch-completing objectives** — 8 material collections in one click; 3
   ecology observations in one touch.
7. **Dead code**: WorldMapScene (registered, never launched), PredictionScene
   (superseded by the UTM lab), 20 unit test files with no runner script.

## What was changed (all verified)

| Fix | Where |
|---|---|
| **Bio doors on every engineering lab overlay** (circuit→extraction, dyno→phyto, crash→microscope, boat→ferment, tunnel→mechanism, vacuum→ecosystem) | `GameShell.jsx` (+ CSS), new e2e `game-rebuild.bio-doors.spec.js` proves all 6 doors open |
| **UTM records predictions into the runtime ledger** (`predictMaterial` via `onMaterialPredicted`) so prediction-precedes-intervention is provable state | `GameShell.jsx`, `UTMLab.jsx` |
| **ExtractionLab completion gated on SUITABLE** (same as every sibling lab) | `ExtractionLab.jsx` |
| **Side quests surface in the tracker** the moment progress starts (QuestSystem activation + `sideQuests` in summary + QuestScene render) | `QuestSystem.js`, `QuestScene.js` |
| **De-pad**: one material per collection visit (8 real visits), one plant per observation (3 real visits) | `Act1RuntimeSystem.js` |
| **Dialogue integrity**: early Esc abandons without effects/completions; leaving from the final line or a choice menu still counts; re-talk always possible | `DialogueSystem.js`, `DialogueScene.js` |
| **Bridge station architecture**: `bridge_plan` → the Phaser truss designer (family choice, 5 roles, brace geometry/triangle lesson, fail→iterate) → Phaser load-test scenarios → repair. The R3F 3-role load sim is a real optional station (`bridge_sim_3d`) beside it; React LoadTestLab keeps its `/loadtest-lab` route; GameShell no longer hijacks `loadTest:start` | `NeighborhoodScene.js`, `GameShell.jsx` |
| **Escape closes every lab overlay** (anti-trap parity with the Phaser modals) | `GameShell.jsx` |
| **Removed dead scenes**: WorldMapScene (rebuild), PredictionScene (superseded; predict flow lives in the UTM lab with a real ledger) | `createGame.js`, `PreloadScene.js`, files deleted |
| **Unit tests wired**: `npm test` / `npm run test:unit` (node --test; 124 pass) | `package.json` |
| **Trigger audit clean** (bio:progression:changed reviewed+allowlisted; prediction channels retired) | `scripts/audit/trigger_graph.mjs` |
| **Specs updated to drive the real player UI** (React UTM lab clicks, truss designer keyboard flow, de-padded collect loops, E-based dialogue driving since Space can't select branch choices) | acceptance, predict-reachability (rewritten), player-reachability suite, ~10 other specs |

## Validation state

- Build: clean. Unit: **124/124**. Trigger audit: **clean (strict)**.
- Full e2e: 97 passed / 8 failed on the first post-fix run — the 8 were re-run
  after fixing three spec-side issues (Space-vs-choice-menu stalls, de-padded
  prerequisites, post-repair gating of the thank-you beat) and removing the
  loadTest:start hijack; several first-run failures were machine-contention
  flakes (blank page at boot) from running the suite, a dev server, and the
  live playthrough simultaneously.
- **Full playthrough via Claude-in-Chrome — the ENTIRE game completed through
  real input** (walking, talking, choices, lab UIs):
  - Act 1: all **10 main quests** + **Mariam's Garden** side quest (surfaced in
    the tracker by the new side-quest fix) + Dex duel beats; 8/8 materials
    collected one-per-visit and predicted-then-tested (ledger: made ≥ tested at
    every step); truss designer family→5-role build → **holds** → load test →
    **bridge reconnected** → Community Crossing → trust talks → wider map →
    `act1Complete: true`; skate park ridden and exited cleanly.
  - Vehicle Ladder: **all 7 chapters engineering-complete** (Circuit Bench,
    Engine Dyno, Crash & Load — solved honestly after 19 failing combos —
    Hydro Tank, Wind Tunnel, Vacuum Chamber) and **all 6 biology pillars**
    (Extraction, Phyto, Microscope with correct stain+magnification, Ferment,
    Mechanism, Ecosystem with a stable Lotka–Volterra balance): final state
    `chaptersComplete:[1..7]`, `bioComplete:[2..7]`.
  - (Hidden-tab throttling freezes Phaser's loop and its loader — worked around
    with a Worker-driven pump; a visible tab needs no workaround.)

## Fixes found BY the playthrough (applied)

- **Hidden-bench completion leak**: the shadowed Phaser Extraction bench fires
  an empty `extraction:done` when GameShell hides it, which silently completed
  biology-2 even on a failed extraction. The completion handler now requires a
  SUITABLE verdict or real discoveries.
- **Quest progress could not survive a refresh**: `loadGame()` existed but
  nothing player-facing called it, and quests never auto-saved. Now: auto-save
  on every first-time objective completion + auto-continue at boot (verified
  live: full run restored after reload — quests, bridge, ZuzuBucks, ladder).

## Bridge Design scene visual rework (2026-07-06, follow-up)

The user flagged the bridge-building scene as "still terrible." Looking at it
in real Chrome revealed three compounding problems, all fixed:

1. **The `leonardo_notebook` art was the wallpaper.** It's a self-contained
   illustration with its OWN frame and BAKED-IN TEXT ("Load Test — does the
   bridge hold?", "Holds the herd — max stress 79%"). Used near-opaque as the
   backdrop, during the *build* phase it read as a finished result already on
   screen. Removed from the backdrop entirely; replaced with a calm solid
   parchment panel + faint ruled-margin flourishes for the notebook feel.
2. **The UI floated naked over the world.** The old 960×600 art left the tray,
   hints, and meters scattered over the neighborhood behind it. Now a dark
   scrim isolates the scene and a bordered panel actually contains every
   element (title, meters, build area, tray shelf, verdict, hint).
3. **The cable piece looked broken.** Its 135° "ideal" swung a 330px-wide bar
   diagonally clear across the span, stabbing past the deck — the single worst
   offender. Changed to a flat top tie (ideal 0°) that seats cleanly as the
   span's top chord; still honestly in tension, material-teaching preserved.

Result: the assembled truss now reads top-to-bottom as a real cross-section
(top tie → deck → diagonal brace → vertical support → foundation); the Da Vinci
arch build view is clean; the blocked/no-materials state is legible. Verified
in Chrome across family select, truss assemble, load-test hold, Da Vinci build,
and blocked states.

## Still open / follow-ups

- **Chapters 2–7 remain single-rig previews by design** (ladder labels them IN
  DEVELOPMENT; each = one engineering lab + one biology lab, both genuinely
  reachable and completable now). Regions/rides/stories per chapter are the
  next content milestone, not a stub.
- Dex still uses a tinted Zuzu sprite (art part B, human-gated).
- The three identical-looking female NPC sprites near the top of the map
  deserve an art-direction look (Mrs. Ramirez / Auntie Mariam / third figure).
- Cesium ion geo-reference captures blocked by null-origin worker issue in the
  Playwright page; retry via a locally-served page.
