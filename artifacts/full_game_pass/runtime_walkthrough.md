# Runtime Walkthrough (STEP 2)

Live runtime evidence from the running dev server (`http://127.0.0.1:5173/
game-rebuild`) driven by Playwright (`game-rebuild.act1-acceptance.spec.js`),
2026-06-02. **Runtime reality first.**

## Headline
- **The game is genuinely playable** through nearly all of Act 1 (verified
  visually): bike check → Mr. Chen → dry wash → collect materials → ecology
  patch → chemistry → UTM material tests → bridge plan.
- **BUT the acceptance gate is currently RED on this working tree** — a 120s
  timeout at the **bridge-plan step**, caused by **uncommitted layout drift**,
  not a gameplay regression and not a change introduced by this pass.

## What the player can actually do today (observed)
| System | Observed in runtime | Evidence |
|---|---|---|
| Movement / prompts | WASD/arrows move; `[E]` interaction prompts appear near zones | failure screenshot (player at garage workbench, "[E] Collect candidate materials") |
| Bike check | works; unlocks `bike_check` notebook | prior green report |
| Mr. Chen dialogue | works; browser TTS (`garage_mentor`) | prior green report (`voiceId: garage_mentor`) |
| Dry wash discovery | works; unlocks `broken_wash`, `bridge_problem` | prior green report |
| Collect materials | works; steel/copper/scrap into inventory | screenshot prompt + inventory |
| Ecology patch | works for **mesquite only**; unlocks `mesquite`,`desert_plant` | runtime; creosote/saguaro NOT triggered |
| Chemistry station | works; unlocks `chemistry_result` | prior green report |
| UTM material testing | works; 4 materials tested; "Weak Scrap: comparison failure. Evidence added." | failure screenshot feedback |
| Bridge plan | reachable; quest tracker "Bridge Plan: Choose a deck material" | failure screenshot |
| Bridge repair → wider map | works in green baseline (`act1Complete`, `widerMapUnlocked`) | prior green report |
| World map / GPS | "Zuzu GPS … near Garage Workbench / G open … 5 places mapped" HUD present | failure screenshot |
| Notebook | 16 entries; **13/16** unlock on the core path | prior green report |
| Voice | browser `speechSynthesis`; audit hook present | report `hookVerified:true` |
| Console errors | none recorded in the green report (`errors: []`) | report |

## Acceptance run result (this pass)
- **FAILED (1 failed)** — `page.waitForFunction` timeout (120s) at
  `interactAt` waiting for the **bridge_plan** step prompt "Plan bridge repair".
- At the test's hardcoded bridge_plan coordinate `(935, 454)` the visible prompt
  is **"Collect candidate materials"** — the wrong zone. The interaction zones
  have shifted relative to the spec's literal coordinates.

## Root cause: uncommitted layout drift (repo drift)
- Working tree `82051da` (branch `overnight/sprint-1-phase-2`) is **not** the
  green golden baseline (`baseline_pre_phase1` = `84a3766`).
- `public/layouts/neighborhood.layout.json` is **modified, uncommitted: +117/−7
  lines** — new `map_gate`, `garage_workbench_prop`, resized GPS device and
  route/landmark markers. The dev server serves this drift via HMR.
- The acceptance spec hardcodes per-step `x/y` (bike `470,432`, materials
  `880,410`, bridge_plan `935,454`, …). The drift moved the zones, so the
  hardcoded coordinates are now **stale** → the player walks to the old
  coordinate and the *nearest* zone is the wrong one → prompt never matches →
  timeout. This is exactly **H1 (hardcoded coordinates)** in
  `foundation/acceptance_hardening.md`.
- These uncommitted changes were **not authored by this pass** and their
  ownership is unclear (accumulated prior overnight/sprint WIP, alongside other
  untracked dirs: `generated_assets/`, `backups/`, Godot prototypes, a stray
  `brain/`, modified `playtest_captures/*.png`, `tools/*.mjs`).

## Interpretation
- **Not a gameplay regression:** the game runs and is playable to the bridge
  step (and the green baseline proves full completion). The *gate* broke because
  the *test's coordinates* are stale vs. the *drifted layout*, not because the
  game is broken.
- **Blocker for Phase 1.x:** the acceptance ratchet requires a GREEN baseline
  before layering changes; building on red would conflate any new change with
  this pre-existing drift breakage. Resolving the drift means touching un-owned
  uncommitted files (a destructive/ownership concern) **or** hardening the
  acceptance spec — both warrant operator awareness (see the autonomous report).

## Dead ends / mismatches noted
- Ecology patch observes only mesquite (creosote/saguaro objectives unreachable).
- Interaction-cue SFX + ambient are silent (instrumented only) — known from the
  voice audit.
- World-map HUD shows "5 places mapped" — verify these are real destinations
  (Phase 2.3 "no fake destinations").
