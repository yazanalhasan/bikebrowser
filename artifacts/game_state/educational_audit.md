# Educational Audit — Phase 7 (Experiences That Exist Today)

**Question:** What educational experiences EXIST TODAY (playable in the live
`src/game/` runtime), not planned?
**Hierarchy to evaluate:** Reasoning → Prediction → Experimentation →
Engineering → Teaching (5 levels).
**Rule:** runtime > docs; implementation > architecture.

---

## The live educational loop (what a child actually does)

The whole shippable educational arc is Act 1, driven by `Act1RuntimeSystem`
and 10 quests (`src/game/data/act1/act1Quests.js:1-122`). Chain:
bike check → find the broken wash → collect materials → **test materials in
the UTM** → plan a bridge (gated on tests) → repair & cross → observe desert
plants → mix/dry/test a sealant → earn neighbor trust (Spanish/Arabic) →
unlock the wider map. The "test before you trust" theme is the spine
(quest `test_materials`, `act1Quests.js:42-53`; trader/bridge-sign dialogue,
`act1Dialogue.js`).

---

## Level-by-level reality check

### Level 1 — Reasoning (Observe → Explain)  — **PARTIAL, present**
- **Occurs:** Material-property comparison produces readable explanations and
  bands ("strong candidate / useful with limits / comparison failure",
  `MaterialsLabSystem.js:34-39`) and a notebook card that explicitly states
  the *concept*: "stiffness, strength, brittleness, and usefulness are not
  the same thing" (`act1NotebookEntries.js:9`). Ecology observation surfaces
  cause-style prose ("shade maker / deep roots", `act1Ecology.js`).
- **Limit:** the "reasoning" is **pre-authored prose the game reveals**, not
  reasoning the game elicits or checks. No `reasoning` engine exists
  (`systems/reasoning/` is a lone substrate `.md`, 0 JS).
- **Grade: C+** (real explain-content delivered; no reasoning evaluation).

### Level 2 — Prediction (Predict)  — **WEAK / thematic only**
- **Expected (per design):** "predict-then-test" is the headline claim.
- **Reality:** the live UTM tests **all 4 materials in a single click**
  (`Act1RuntimeSystem.js:173`). There is **no prompt that captures the child's
  prediction and compares it to the result.** A search for
  `predict|guess|hypothes` in the live scene + dialogue returns nothing
  (only the *value* "you brought proof, not guesses" in Arabic dialogue).
  The visualizer shows deformation *after* the click (`updateUtmVisualizer`,
  `NeighborhoodScene.js:891-901`), so the loop is **test → see**, not
  **predict → test → compare**.
- **Grade: D** (strong as a theme/visualization; the interactive prediction
  step is not implemented).

### Level 3 — Experimentation (controlled testing)  — **PARTIAL**
- **Occurs:** the UTM is a genuine comparative test bench — same load applied
  to 4 samples, deterministic, results recorded as evidence and rendered as
  deformation. That *is* a fair-test framing. Chemistry nominally has a
  mix→wait→test loop.
- **Limit:** no variable the child controls (load is fixed; you don't vary
  conditions). Chemistry has no real reagent combination — 2 hard-coded
  recipes returning canned strings (`ChemistrySystem.js:18-26`). So
  "experimentation" = run a fixed test and read evidence, not design an
  experiment.
- **Grade: C** (best-realized as comparison; not learner-driven variables).

### Level 4 — Engineering (build from evidence)  — **FUNCTIONAL (strongest enforced moment)**
- **Occurs:** `completeBridgePlan` **hard-refuses** until all 4 materials are
  tested (`ConstructionSystem.js:25-27`) and **rejects** a weak-scrap-only
  plan with an explanation (`:18-23`). Repair → cross → upgrade bike → unlock
  route is gated on a tested plan (`Act1RuntimeSystem.js:201-232`). The NPC
  payoff names the lesson: *"You did not guess. You tested, then built."*
  (`ConstructionSystem.js:47`).
- **This is the one place the runtime mechanically requires evidence before
  action** — the most credible educational mechanic in the build.
- **Grade: B** (real evidence-gated engineering, though the "plan" is a single
  fixed correct configuration, not open design).

### Level 5 — Teaching  — **MISSING in runtime**
- No mechanic where the child explains/teaches back. The "teach" tier exists
  only in the design framework (`educational_progression_framework.md`,
  Chapter 7 "Engineer → Teach"). The closest live proxy is the **Field
  Notebook** (16 evidence cards, `NotebookSystem.js`) functioning as
  externalized recall — but the game never asks the child to author or teach.
- **Grade: F (absent).**

---

## Summary of what's actually educational TODAY

| Level | Live status | Evidence | Grade |
|---|---|---|---|
| Reasoning (Observe/Explain) | Authored prose revealed | `MaterialsLabSystem.js:34-39`, `act1NotebookEntries.js` | C+ |
| Prediction | Theme only, no captured hypothesis | `Act1RuntimeSystem.js:173`; no `predict` prompt | D |
| Experimentation | Fixed comparative test bench | UTM + visualizer `NeighborhoodScene.js:868-917` | C |
| Engineering | **Evidence-gated build** (best) | `ConstructionSystem.js:18-27,47` | B |
| Teaching | Absent (notebook = recall only) | `NotebookSystem.js` | F |

**Bottom line:** The strongest realized experience is **engineering-from-
evidence** (the bridge plan refuses untested materials), with the UTM
comparison bench close behind. The advertised "predict-then-test" is present
as *theme and visualization* but **not as an interactive prediction step**.
Reasoning is delivered as pre-written explanations, not evaluated. Teaching
does not exist in the runtime. Everything richer (graded curriculum, 100
quests, the 5-tier hierarchy with Predict/Teach mechanics) lives in design
docs (`artifacts/biology_next_phase/`, `data/curriculum/chapter-map.md`).
