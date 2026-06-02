# Phase 1.6 — Bridge Construction V1 (choice → consequence)

Give the player a real engineering decision: choose a tested material for each
load-bearing role; the bridge outcome depends on the choice.

## Meaningful-choice checklist (the new bar)
- **Can the player make a meaningful decision?** Yes — assign a material to each
  of deck / support / brace.
- **Can the player be wrong?** Yes — a weak material in any load-bearing role
  makes the load path unsafe (the design is rejected).
- **Can the player learn why?** Yes — the failure names the exact role(s) and the
  rule ("a bridge is only as strong as its weakest part").
- **Can the player improve?** Yes — re-choose with bridge-safe materials → the
  design is accepted and the plan is created.

## Changes (one scoped slice)
1. `MaterialsLabSystem.getTest(id)` — exposes a material's stored test verdict.
2. `ConstructionSystem.designBridge({deck, support, brace})` — consequence engine:
   - incomplete selection → `incomplete_selection` (which roles).
   - any untested material → `untested_materials` (test first).
   - **all** load-bearing roles weak → `all_unsafe` / outcome `collapse`.
   - **some** weak (mixed) → `mixed_unsafe` / outcome `unsafe`, names the failing
     role(s).
   - **all** bridge-safe → `outcome: safe`, creates the plan.
3. `Act1RuntimeSystem.designBridge` — wraps it with feedback (success names the
   lesson; failure names the unsafe role) + completes deck/support/brace
   objectives + unlocks `bridge_plan` on success. Exposed on `__GAME__`.
4. `acceptance spec` — at the bridge step, runs a **bad** design (weak_scrap
   support) and a **good** design (steel support), and **asserts**: bad →
   `{ok:false, outcome:'unsafe', reason:'mixed_unsafe'}`; good →
   `{ok:true, outcome:'safe'}`. Coverage strengthened.

## Validation
- `npm run build`: ✓ (8.1s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.6m)**.
- Bridge choice (live): `bad {ok:false, outcome:'unsafe', reason:'mixed_unsafe'}`,
  `good {ok:true, outcome:'safe'}`.
- Engineering loop still completes end-to-end; console errors: none.

## Divergence / design note
The legacy bridge tree is large; only the **smallest useful mechanic** (tested
material → role assignment → load-path consequence) was ported, per the
directive. The existing `completeBridgePlan` default path remains for the guided
walkthrough; `designBridge` is the interactive choice mechanic (acceptance-
proven). An in-scene material-selection panel is the thin follow-up; the
choice/consequence/feedback core is real and reachable via `__GAME__`.

## Result
The "Build" step of the loop is now a real decision with stakes: good materials
succeed, poor materials fail, mixed designs fail with a specific, teachable
reason.

## Next
Phase 1.7 — Reasoning Grader (evaluate prediction + evidence + reasoning quality,
not mere correctness). Then arc_alignment_report.md updated.
