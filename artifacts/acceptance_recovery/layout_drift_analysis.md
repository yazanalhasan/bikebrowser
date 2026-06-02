# Layout Drift Analysis

Analysis of the uncommitted `public/layouts/neighborhood.layout.json` drift on
`overnight/sprint-1-phase-2` and its effect on Act-1 acceptance.

## Drift summary (vs `baseline_pre_phase1` = `84a3766`)
`neighborhood.layout.json`: **+117 / −7 lines, uncommitted.** Changes include:
- New `map_gate` (x 1484,514 — matches the `wider_gate` zone).
- New `garage_workbench_prop` (650,318) + label/marker.
- Resized GPS device (158,29→232,32; 48×36→62×45) and route/landmark marker
  display sizes (21→24).
- The interaction-prop cluster positions (`material_table`, `bridge_plan_
  workbench`, etc.).

The committed `NeighborhoodScene.js` reads all these from `this.layout.*`, so the
JSON drift directly changes runtime zone positions without any code change.

## The defect introduced by the drift
The drift placed two distinct interaction props too close:
| Prop (layout key) | Drifted pos | Drives zone | 
|---|---|---|
| `material_table` (interactionX/Y) | (905, 420) | `materials_table` "Collect candidate materials" |
| `bridge_plan_workbench` (x/y) | (920, 438) | `bridge_plan` "Plan bridge repair" |

Separation ≈ **23 px** → nearest-zone ambiguity → acceptance timeout at the
bridge_plan step (full chain in `acceptance_failure_root_cause.md`). Baseline
separation of these zones was ~70 px (green).

## Ownership classification (per commit policy)
| Item | Class | Action |
|---|---|---|
| `neighborhood.layout.json` (the file under fix) | **KEEP** | Live runtime uses it; map_gate/garage_workbench_prop are coherent additions. Commit the zone-separation fix here. |
| `bridge_plan_workbench` (920,438) collision | **FIX** | Moved to (1000,452); ~100 px from materials. |
| Godot prototypes, `playtest_captures/*.png` (modified), `generated_assets/`, `backups/`, stray `brain/`, `tools/*.mjs` | **UNKNOWN / DROP** | Not authored by this session; **NOT committed**; left untouched for operator review. |

## Fix
- `bridge_plan_workbench`: **(920,438) → (1000,452)** — sole change to restore
  green. Preserves visual readability (stays in the interaction band, shifted
  toward the bridge/wash side, which is narratively coherent for a bridge-plan
  workbench). No other layout values changed by this session.

## Verification
- Act-1 Playwright acceptance re-run (see `fresh_green_baseline.md`).
- Fresh screenshots captured.
- No assertions weakened; only the game layout corrected.

## Prevention
- Regression guard for acceptance robustness: `acceptance_hardening.md` S1
  (`interactions.byId()` for scripted precision) remains the recommended
  defense-in-depth against future closely-spaced zones (deferred; optional).
- A lightweight "min interaction-zone separation" assertion could be added to a
  smoke test to catch future layout collisions before they reach acceptance.
