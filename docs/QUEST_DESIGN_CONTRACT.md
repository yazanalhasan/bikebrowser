# BikeBrowser Quest Design Contract

**Status: binding.** Every major quest, regardless of subject area, follows the same
core learning structure. The player never memorizes facts — they **discover,
predict, test, build, and verify**. The subject changes; the loop does not.

> Canonical learning spine: **Observe → Predict → Test → Build → Verify → Payoff → Reflect**

---

## The Universal Quest Loop

| # | Step | The player must… | Anti-pattern it replaces |
|---|------|------------------|--------------------------|
| 1 | **Observation** | Encounter a problem that is **visible in the world** and observe clues before being told the answer; record observations in the notebook. | Being told the problem in exposition. |
| 2 | **Prediction** | **Commit to a hypothesis** before testing/intervening. Predictions are tracked. Wrong predictions are acceptable and educational. | Skipping straight to the answer. |
| 3 | **Experimentation** | Gather evidence **through interaction, not exposition**. Evidence visibly confirms or rejects the prediction. | Reading the result off a tooltip. |
| 4 | **Design / Intervention** | **Physically assemble, configure, arrange, or build** a solution from the evidence. Menu-only solutions are avoided. | Picking the answer from a dropdown. |
| 5 | **Verification** | Test the solution; **success and failure are both visible** with real consequences. | Auto-success. |
| 6 | **Social / World Payoff** | See the solution **affect people, animals, communities, or the world**, and understand why it mattered. | A solution with no stakes. |
| 7 | **Reflection** | The notebook records what was observed, predicted, tested, chosen, and what happened — the player's **scientific journal**. | No record; nothing learned. |

## Forbidden Quest Patterns
- Kill X enemies • Collect X items with no purpose • Trivia quizzes
- NPC exposition without interaction • Arbitrary fetch quests
- Random crafting recipes without testing

## Required Outcome
Every quest teaches **Observe → Predict → Test → Build → Verify**. The subject matter
may change; the learning structure must not.

---

## How the engine binds each step (reference implementation: *Mr. Chen's Crossing*)

These are the seams a new quest plugs the same shapes into. Keep these contracts.

| Step | Mr. Chen's Crossing | Engine seam |
|------|---------------------|-------------|
| 1 Observe | Broken bridge + washout visible in the world; "Investigate the washout" mini-loop; notebook logs `broken_wash`, `bridge_problem`. | world interaction zones → `notebook` unlocks; `InvestigationScene` |
| 2 Predict | Predict-before-test: per material, commit `willHold` + confidence + reasoning. | `prediction:start` → `PredictionScene` → `runtime.predictMaterial()`; `__PREDICTION__` |
| 3 Test | UTM stress/strain test of 8 materials; verdict resolves the prediction ("Evidence beats a guess") → `prediction_log`. | `MaterialsLabSystem` → `runtime.testMaterial()` → `predictionSystem.resolve()` |
| 4 **Build** | **Hands-on assembly**: drag/keyboard parts from a tray onto deck/support/brace/cable/foundation snap zones; rotate, snap, reject, unsafe-warn; "Test Bridge" gate. | `bridgeDesign:start` → `BridgeDesignScene` → `ConstructionSystem.designBridge(selection)` |
| 5 Verify | Load test runs 5 escalating scenarios (person → monsoon); the weak part fails red, a sound bridge holds — visible. | `loadTest:start` → `LoadTestScene` + `StructuralModel` |
| 6 Payoff | Crossing cutscene reconnects Mr. Chen ↔ Mrs. Ramirez; wider map opens. | `crossing:start` → `CrossingScene`; `unlockWiderMap()` |
| 7 Reflect | Notebook journals observation, prediction outcome, test results, the chosen plan, and the repair. | `act1NotebookEntries` + state-driven unlocks |

**Compliance:** ✅ all 7 steps. The 2026-06-06 assembly redesign closed the Build gap
(was a card-picker → now physical assembly). Optional deepening: an explicit
"will it hold the monsoon?" prediction commit *before* Test Bridge would add a second
predict-loop at the design stage (currently the predict-loop lives at material testing).

---

## Acceptance checklist (apply to every new quest before "done")
A quest is contract-complete only when an evidence-grounded answer to all seven is **yes**:

1. Is the problem **visible in the world** and observable before exposition? Notebook logs it?
2. Does the player **commit a tracked prediction** before testing?
3. Is evidence gathered by **interaction**, and does it visibly confirm/reject the prediction?
4. Does the player **physically build/assemble/configure** the solution (not a menu pick)?
5. Is the solution **tested with visible success *and* failure** states?
6. Does success produce a **social/world payoff** the player understands?
7. Does the **notebook record** observed → predicted → tested → chosen → outcome?

Plus: none of the Forbidden Patterns appear.

---

## Enforcement (Executive Brain)
This contract is mirrored as a machine-readable governance policy in EB:
**`memory/procedural/quest_design_policy.yaml`** (schema `schemas/procedural.py`). Two
rules are `enforcement: blocking` — **`quest.physical_construction_required`** and
**`quest.verification_required`** — encoding the governance rule: *reject quests that
skip Physical Construction or Verification; menu-only solutions are not sufficient when
a manipulable simulation is feasible.* The remaining steps are `required`/`advisory`.

**"Build" means physical Assemble, not menu-pick.** Reference implementation: the bridge
quest's hands-on construction — choose a **bridge family**, then drag/rotate/seat parts.
The **Da Vinci self-supporting bridge** is the flagship: interlocking wooden beams seated
bottom-up (no nails) where wrong geometry collapses and the chosen wood is then
load-tested — geometry *and* material both matter.
