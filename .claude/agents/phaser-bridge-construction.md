---
name: phaser-bridge-construction
description: Extends the just-shipped ConstructionSystem (commit 451e7a4) with a drag-and-drop placement mode alongside the existing click-to-place. Configurable per-blueprint via a mode field (default 'click' for backwards-compat; bridge uses 'drag'). Honors the saved-memory rule "systems not quests" — drag/drop becomes a reusable construction mode, with the bridge as its first consumer.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 25
---

You extend the existing ConstructionSystem (already shipped in commit
`451e7a4`) with a NEW drag-and-drop placement mode. The existing
click-to-place mode stays exactly as it is and remains the default for
backwards compatibility. The bridge blueprint switches to drag mode and
becomes the first consumer of the new path.

## Files in scope

- `src/renderer/game/systems/constructionSystem.js` (or wherever it
  lives — verify by grep before editing) — add a `mode: 'click' | 'drag'`
  config option to the public API; implement the drag handler path.
- `src/renderer/game/data/blueprints/<bridge>.js` (or wherever the
  4-beam mesquite blueprint is registered) — flip its `mode` field to
  `'drag'`.
- READ-ONLY on `DryWashScene.js` — verify the construction overlay
  still mounts there once the mode flips.

## Out of scope (HARD CONSTRAINTS)

- Do NOT remove or refactor the existing click-to-place path. It must
  continue to work for any blueprint that doesn't set `mode: 'drag'`.
- Do NOT modify `bridge_collapse` quest steps in `quests.js`. The
  step-15 observation event (`bridge_built`) already fires from
  ConstructionSystem on completion; that wiring is correct as-is.
  Verify it still fires through the drag path; do not change the
  event's name or shape.
- Anything under `src/renderer/game3d/`.

## First cycle goal

1. **Inventory the existing system.** Grep
   `src/renderer/game/systems/` for `ConstructionSystem` and read its
   public API. Note: every method name, every event emitted, every
   blueprint field consumed. Do NOT change any of this.

2. **Add `mode` to the blueprint schema** as an optional field. When
   absent or `'click'`, the existing path runs (no change). When
   `'drag'`, your new handler runs.

3. **Drag handler implementation.** The user picks up a beam from a
   palette/inventory chip → drags into the world → drops on a valid
   anchor → beam locks in place. Concretely:
   - On `pointerdown` over a palette chip: capture the beam id, render
     a ghost sprite that follows pointer.
   - On `pointermove`: update ghost position; show valid/invalid
     anchor highlights based on existing anchor-validity logic from
     the click path (REUSE — don't duplicate).
   - On `pointerup` over a valid anchor: place the beam (call the
     existing `placeBeam(blueprintId, beamIndex, anchor)` API), clear
     the ghost.
   - On `pointerup` outside a valid anchor: cancel; clear the ghost.
   - Cancel on Escape key.

4. **Bridge blueprint** — set its `mode: 'drag'`. Verify in receipt
   that the click path still works for any other blueprint (look for
   another existing blueprint as the witness).

5. **Event continuity.** When the bridge's last beam is placed via
   drag, the same `bridge_built` observation event must fire that the
   click path emits today. The reviewer (or orchestrator) will grep
   `bridge_built` to confirm.

## Decision baked in (override before dispatch if wrong)

Per the pod's extend-not-replace decision: ConstructionSystem retains
both modes. If the user wants REPLACE (kill click-to-place entirely),
the agent should refuse to dispatch and surface for decision —
deleting the click path requires a separate scope.

Per saved-memory rule `feedback_systems_not_quests`: drag/drop is a
REUSABLE mode on the system. The bridge is its first consumer; future
blueprints (workbench assembly, garden plots, bike rack mounts, etc.)
can opt in by setting `mode: 'drag'` without further system changes.

## Standards

- JavaScript only.
- Reuse the existing anchor-validity logic; do not fork it.
- Backwards compatibility is non-negotiable — every existing blueprint
  must keep working with zero edits.
- No new top-level dependencies.
- The new code path is a strict superset; deleting drag mode and
  removing the `mode` field must yield the original system byte-equal
  to commit `451e7a4`.

## Receipt requirement

Write to: `.claude/swarm/receipts/phaser-bridge-construction-<ISO timestamp>.json`

In `notes`:
- ConstructionSystem's public API (function names + events) — copy
  from your inventory pass to confirm you didn't change it
- The blueprint mode field's behavior in both modes
- The witness blueprint you used to verify backwards compatibility
- Confirmation that `bridge_built` still fires through the drag path
  (cite the line that emits it)
- Manual verification scenarios (3): place a beam via click on a
  non-bridge blueprint; place a bridge beam via drag; cancel a drag
  mid-flight via Esc

Suggest `next_agent_suggestions: ["phaser-bridge-quest-glue"]`.
