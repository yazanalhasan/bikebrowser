# BikeBrowser — Executive Summary & Strategic Recommendation

Baseline established by a 16-phase, evidence-based reality audit (this
folder, 1,700+ lines, 5 independent investigation passes). Rule held:
**reality > design docs.** Where the audit and the design corpus
disagreed, reality won.

## The one-paragraph truth
BikeBrowser today is a **polished ~90-second Act-1 desert vertical slice**
(`src/game/`, served at `/game-rebuild`): bike-inspect → NPCs → dry wash →
**UTM material tests** → **evidence-gated bridge repair** → trust →
wider-map unlock → Field Notebook (11 wired quests, 32 objectives, 4
animated characters). It is a **Functional Prototype** with one genuinely
strong, educational core loop (**test-before-you-trust**) and several dead
ends. Surrounding it is a **vast, mostly-unimplemented design corpus** —
the 7-vehicle spine, the biological spine (ethnobotany→…→terraforming),
reasoning/curriculum, food-web, Sonoran dataset, visual architecture v2.0,
MiniMax — almost all authored in the **last day** as documents with **0
JS**. A second, larger code tree (`src/renderer/game/`, ~70k LOC, real
ecology/biology/materials systems) exists but sits **off the shipping
path** at `/legacy-play`, with its dynamic-simulation pieces as **throwing
stubs**. Net: **~5–10% of the documented vision is built**, and that
fraction is the mechanical desert slice — a piece of Chapter 1 of a
7-chapter, 3-act design.

## Strongest / weakest (evidence)
- **Strongest system:** Materials/UTM rig + evidence-gated construction —
  the bridge refuses untested/weak materials (`ConstructionSystem.js:18-27`).
- **Strongest content:** the bridge-repair beat + 4 bilingual characters.
- **Weakest systems:** vehicles (bike = 31-LOC stub; rest Missing),
  simulation (nothing time-steps; biology Stage 2/3 throw), the biology
  spine (Design Only).
- **Weakest content:** the wider-map dead end; the 25 quests / Sonoran
  dataset / curriculum that are design docs, not gameplay.
- **Biggest risk:** the design-vs-reality gap + the off-path tree split.
- **Biggest opportunity:** the proven test-before-you-trust loop.

---

## Phase 16 — Strategic Recommendation (next 3 months)

The design corpus already over-indexes on **simulation systems** and
**new vehicles** — the two areas the evidence shows are *least* ready
(throwing stubs; Design Only) and *most* risky to build on an
unimplemented base. So the recommendation deliberately **inverts the
design-doc momentum**: consolidate the codebase, deepen the one proven
loop, and make the existing slice actually playable and fun — before
expanding the spine.

| % | Focus (your categories) | Why — evidence |
|---|---|---|
| **30%** | **G. Technical Debt** | Two parallel game trees with **inverted route names**; the capable systems are off-path at `/legacy-play`; the last day's commits are docs that read like systems. **Decide the canonical tree and consolidate** — this unblocks everything else. (`technical_debt_audit.md`, `roadmap_reconciliation.md`) |
| **25%** | **C. Repair / Engineering** | The UTM + evidence-gated construction is the **one proven strong loop** (`educational_value_audit.md` B/B+; the "magical beat" in `fun_audit.md`). Deepen it: real player choice, mastery, consequence, more bike-repair depth (today the bike is a 2-boolean stub). |
| **20%** | **E. Educational Systems** | The single highest-leverage fix: add the **captured-hypothesis / predict-then-test** step. Today "predict-then-test" is **theme only** — the UTM tests all four materials in one click (`Act1RuntimeSystem.js:173`). Small change, turns a visualization into real learning. |
| **15%** | **F. World Building** | Fun is **~2.3/5** mostly because of **dead ends** — the wider-map unlock leads to an empty stub, buildings are un-enterable (`fun_audit.md`, `runtime_reality_audit.md`). Make the payoff lead somewhere; raise the ceiling. |
| **10%** | **A. Content** | Finish Act-1 gaps only: wire `desert_helper`'s missing observation zone (the 3 absent notebook clues) and the 16th clue (`quest_audit.md`). Not new content — *completion*. |
| **0%** | **B. Simulation** | **Defer.** Least ready (throwing stubs, off-path); building it now stacks systems on an unimplemented base. |
| **0%** | **D. Vehicle Systems** | **Defer.** Boat/aircraft/spacecraft are Design-Only; prove the loop on the bike first. |

### Justification in one line
**Consolidate (30%) → deepen the proven loop (25% + 20%) → make it
playable and fun (15% + 10%) → only then scale the spine.** This converts
a 90-second demo into a real, teachable, fun Act 1 on a single codebase —
and validates the core thesis *before* the expensive biology/vehicle
expansion the design docs describe.

### Guardrail
Stop producing design documents and unwired data until implementation
catches up. The audit's clearest signal is that **documentation has been
mistaken for progress.** The next milestone should be measured in
*playable runtime*, not pages.

---
*Full evidence: the 14 phase audits + `bikebrowser_state_of_the_game.md`
in this folder.*
