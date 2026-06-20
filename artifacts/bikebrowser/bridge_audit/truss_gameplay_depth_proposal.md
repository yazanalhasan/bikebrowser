# Truss Gameplay Depth — Phase 2 Proposal (Executive Brain)

**PROPOSAL ONLY — not implemented. Awaiting approval.** Phase 1 stopped the
click-through; it did not make the truss a real *engineering* decision. Today every
load-bearing role validates against one flag (`bridgeSafe`), so "steel everywhere"
is trivially optimal and role identity (tension/compression/stiffness) is
decorative. This proposes turning each role into a meaningful choice while
preserving Act 1 progression, the educational spine, and a kid-appropriate
difficulty.

Guiding constraint: **reuse `BridgeDesignScene` + `ConstructionSystem` + the
existing material data** (`act1Materials.js` already has `strength`, `stiffness`,
`tensileStrength`, `compressiveStrength`, `weight`, `curve`). No new engine.

## 1. Role-specific material logic
Replace the single `bridgeSafe` gate with a **per-role property check** driven by
fields the materials already have:
| Role | Property that matters | Material field(s) | Lesson |
|---|---|---|---|
| **deck** | stiffness / bending resistance | `stiffness` | a bouncy deck is unsafe even if "strong" |
| **cable** | tension strength | `tensileStrength` | concrete/brick fail here even though they're "hard" |
| **foundation** | compression strength | `compressiveStrength` | concrete/brick *shine* here (the teaching inversion) |
| **support** | compression + strength | `compressiveStrength`, `strength` | columns carry load down |
| **brace** | strength + stiffness (triangle) | `strength`, `stiffness` | triangles resist; the diagonal must hold |

Solver change (in `ConstructionSystem.designBridge`): each role passes if its
material's *relevant* property clears a per-role threshold (still requires the
material to be **tested** — Observe→Test preserved). The verdict names the role AND
the property: *"The cable used concrete — strong in compression, but it tears under
tension."* This makes the **concrete inversion** (great foundation, terrible cable)
the centerpiece lesson, and kills "one material everywhere."

Backward-compat: keep `bridgeSafe` as a floor (a material that snapped outright at
the UTM still fails any role); add the property check on top. Existing saves /
debug paths that pass full selections still resolve.

## 2. Rotation — make it mean something, or remove it
Currently truss `R` is cosmetic (solver ignores angle). Two options:
- **(A) Make it meaningful (preferred, on-theme):** the **brace** role rewards a
  diagonal (triangle) and penalizes a flat/vertical placement — "triangles resist,
  rectangles deform" is literally the truss family's stated concept. Feed the
  brace's angle into a small stability term: a braced triangle passes at lower
  material strength; a non-triangulated brace needs a stronger material. Only the
  brace cares — keeps it simple. Other roles ignore angle (drop `R` there).
- **(B) Remove it:** if (A) is too much for Act 1, **remove `R` from truss** so the
  control doesn't imply meaning it lacks (keep it for Da Vinci, where it matters).

Recommendation: **(A) for the brace only**; fall back to (B) if scope-constrained.

## 3. Unsafe materials — block or reasoned-allow
Recommendation: **allow placement, but with immediate reasoned feedback** (do not
hard-block). Rationale: "Trust Evidence" is learned by *seeing* a wrong choice fail,
not by being prevented from making it. Phase 1 already warns on the held-preview;
Phase 2 adds the *role-specific reason* at place time (*"Balsa in the support — it
crushed at 2/10 strength; the load has nowhere to go."*) and at the load-test
result. Provide a one-tap **"swap this part"** affordance on the result screen so
failure is a fast, non-punishing iteration (Observe→Predict→**Test**→revise).

## 4. Reduce answer leakage from labels
Today each tray piece is stamped `✓ held` / `✗ snapped` — the answer is printed on
the part, so no inference is needed. Proposal:
- Replace the binary stamp with the **evidence the player gathered at the UTM**: the
  material's *measured* properties (e.g. small stiffness/tension/compression pips),
  not a verdict. The player must read "high compression, low tension" and decide
  *which role* it suits.
- Keep a subtle "tested ✓" dot (proof they tested it — Observe), but drop the
  pass/fail verdict from the tray. The verdict still appears at **load test** (the
  payoff), so testing remains the source of truth.
- Net: the decision moves from "match green to slot" to "match property to role."

## 5. What Da Vinci does better → adapt (don't overbuild)
| Da Vinci strength | Adapt to truss as |
|---|---|
| **Geometry gates before the solver** (floating/wrong-angle beam visibly collapses) | the brace-angle stability term (§2A) — a *small* geometry gate, not a full physics sim |
| **Restricted, meaningful material set** (3 woods) forces thinking | per-role property thresholds (§1) make the material set's differences matter |
| **Bottom-up dependency** teaches load transfer | name the **load path** in the verdict (deck→brace→support→foundation→ground) so the player sees the chain |
Do **not** port Da Vinci's full interlock dependency to truss — that would overbuild
and double the UI. Borrow the *principle* (geometry/role matters), not the machinery.

## 6. Educational goal preserved
- **Observe:** read each material's measured properties (§4) instead of a verdict.
- **Predict:** choose a material per role based on the property it needs (§1).
- **Test:** the load test still adjudicates; the brace angle is a visible variable (§2).
- **Trust Evidence:** wrong role-fits fail with a *reasoned* explanation and a fast
  retry (§3). The concrete inversion (good foundation, bad cable) is the memorable
  "evidence beats intuition" beat.

## 7. Risks & mitigations
| Risk | Mitigation |
|---|---|
| **Too hard for kids** | per-role thresholds tuned generously; multiple materials satisfy each role; warnings + reasoned feedback + one-tap swap; never a dead end |
| **Breaks Act 1 progression** | success criteria unchanged (a sound design still unlocks the plan + load test); keep `bridgeSafe` floor + property check additive; re-run bridge-reachability + smoke before merge |
| **UI complexity creep** | no new screens; reuse tray + meters + verdict; replace the verdict stamp with property pips (net-neutral UI); rotation limited to the brace |
| **Solver regressions** | property check is additive and unit-testable in `ConstructionSystem`; add targeted tests (concrete→foundation passes, concrete→cable fails) |
| **Scope (frozen Act 1)** | this is a *gameplay* change → requires explicit approval; ship behind review; revertible (data-threshold + verdict-string changes, localized to one solver method + tray rendering) |

## 8. Suggested phasing (if approved)
1. **2a (solver):** per-role property thresholds + reasoned verdicts + tests. (Core lesson; low UI risk.)
2. **2b (tray):** swap pass/fail stamp → property pips (reduce leakage).
3. **2c (brace angle):** rotation→stability for the brace only (or remove `R` from truss).
4. **2d (polish):** one-tap "swap part" on the result screen; name the load path.

Each sub-phase is independently shippable and independently revertible. **No work
begins until approved.**
