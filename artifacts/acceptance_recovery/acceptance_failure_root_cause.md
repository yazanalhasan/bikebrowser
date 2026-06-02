# Acceptance Failure — Root Cause

The Act-1 acceptance gate went RED on the `overnight/sprint-1-phase-2` working
tree. Root cause determined by **live runtime evidence**, not inference.

## Classification: **B (layout drift) → D (interaction-zone collision)**
Not A (acceptance-script), not C (gameplay-logic regression), not pure E. The
acceptance script already derives walk targets from the **live** runtime zones
(`interactionTarget` reads `scene.interactions.zones`), so the failure is **not**
stale hardcoded coordinates. The committed `NeighborhoodScene.js` is **unchanged
since the green baseline** (`git diff baseline_pre_phase1..HEAD` empty). The
zone positions come from `public/layouts/neighborhood.layout.json`, which has
**uncommitted drift**.

## The failure
- Test: `game-rebuild.act1-acceptance` → 120s timeout in `interactAt` at the
  **bridge_plan** step, waiting for prompt "Plan bridge repair".
- Failure screenshot: player at the workbench, visible prompt **"Collect
  candidate materials"** (the *materials* zone) — the wrong prompt won.

## Why (measured live)
Live interaction zones on the drifted tree:
- `materials_table` (collect) → **(905, 420)**
- `bridge_plan` (plan) → **(920, 438)**
- Separation = √(15² + 18²) ≈ **23 px**.

The acceptance `walkTo` arrival band is 24 px, and `activeInteraction` returns
the **nearest** zone. With the two distinct interactables only ~23 px apart, when
the player reaches the bridge_plan target the *nearest* zone is `materials_table`,
so `scene.prompt.text` shows "Collect candidate materials" and never "Plan bridge
repair" → timeout.

## This is bad gameplay reality, not a stale test
Two **different** interactables (collect materials vs plan the bridge) sitting
~23 px apart is a genuine design defect: a *human player* hovering there also
can't reliably target one versus the other — the nearest-zone resolver flips
between them. The acceptance test correctly surfaced a real runtime ambiguity.

Per the rule "only make acceptance reflect reality if reality is correct" — here
reality is **wrong**, so the fix is in the game (separate the zones), **not** the
test. No assertion, step, threshold, or coverage was changed.

## Fix applied
`neighborhood.layout.json`: moved `bridge_plan_workbench` from **(920, 438)** to
**(1000, 452)** — ~100 px from `material_table` and clear of all other zones,
shifted toward the bridge/wash side (narratively coherent), keeping it in the
interaction band for visual readability. See `layout_drift_analysis.md` and
`acceptance_coordinate_audit.md`.

## Provenance note
The layout drift (+117/−7 lines: also `map_gate`, `garage_workbench_prop`,
resized GPS/markers) was pre-existing uncommitted work, **not** authored by this
session. The zone-separation fix is committed scoped to the layout file under
`fix(game): restore Act 1 acceptance by separating workbench interaction zones`;
the prior layout additions in the same file are classified **KEEP** (the live
runtime uses them and they are coherent map content). Unrelated drift (Godot
prototypes, PNGs, generated_assets, etc.) was **not** committed.
