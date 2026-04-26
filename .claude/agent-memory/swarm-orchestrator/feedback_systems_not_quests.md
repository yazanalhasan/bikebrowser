---
name: Build reusable systems, not per-quest implementations
description: Hard rule from 2026-04-26 — every quest-related dispatch must produce a reusable interaction SYSTEM that the quest happens to be the first consumer of. Per-quest one-offs are forbidden.
type: feedback
---

Every dispatch that builds something for a quest must build a **reusable system** with the quest as its first consumer — not a per-quest scene or per-quest one-off.

**Why:** User course-corrected after MaterialLabScene shipped (commit 09062ee, 2026-04-26T16:15:00Z) — that scene was 868 LOC of bespoke per-quest code. The user said: "Stop treating quests as individual implementations. We will build reusable interaction systems and apply them across quests." The cost of fixing this later (refactoring shipped scenes back into systems) is much higher than the cost of building it as a system from the start.

**Priority systems backlog** (user-stated 2026-04-26):
1. **Lab Rig System** — UTM + Thermal + Battery rigs share an apparatus + animated-specimen + readout + run-test lifecycle abstraction.
2. **Physics Interaction System** — buoyancy, fluids; reusable across water-quests.
3. **Inspect System** — generalizes the `observe` step type across quests, replacing per-scene observation handlers.
4. **Construction System** — bridge, shelter; ghost-placement → load-test → permanent-world-change pattern.
5. **Environment Reaction System** — heat, desert effects; reusable env-modifier hooks for any scene.

**How to apply:**

- When the user requests a quest-related feature, the dispatch deliverable is the **system**, not the quest. The quest is named as the first consumer to ground scope.
- Every dispatch prompt must include: "Build this as a reusable [system name] that [target quest] is the first consumer of. The system must be designed so [other quest A, other quest B] could be added as a second consumer with only configuration + drawing helpers, not by duplicating the lifecycle."
- Reviewer standards must include a "second-consumer thought experiment" — "could this be re-skinned for [another quest] with subclass-only changes, or would it require copying logic out of the first scene?"
- When this rule conflicts with the per-cycle pause-after-each-agent constraint, dispatch in two phases: (1) system + first consumer, (2) refactor an existing one-off to also use the system, proving the abstraction.
- The MaterialLabScene shipped in commit 09062ee is the canonical example of what NOT to do going forward. It will be refactored to extend LabRigBase in a follow-up dispatch.
