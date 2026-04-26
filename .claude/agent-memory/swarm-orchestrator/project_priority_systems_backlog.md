---
name: Priority systems backlog (interaction systems, not per-quest)
description: Five reusable interaction systems on the queue as of 2026-04-26. Every quest-related dispatch from now on builds against this list, not per-quest implementations.
type: project
---

**Priority systems list, declared 2026-04-26 by user immediately after MaterialLabScene (commit 09062ee) shipped as a per-quest one-off.**

| # | System | First consumer | Second consumer | Other consumers |
| - | ------ | -------------- | --------------- | --------------- |
| 1 | Lab Rig System | Thermal Expansion Rig (heat_failure) | UTM (bridge_collapse, refactor MaterialLabScene) | Battery Rig, future analytical-instrument quests |
| 2 | Physics Interaction System | tbd buoyancy quest | tbd fluids quest | water-related quests |
| 3 | Inspect System | replaces all `observe` step handlers | every observe step in quests.js | all future observation gameplay |
| 4 | Construction System | Bridge Construction (bridge_collapse step 15) | Shelter (future) | any "place beams + load-test" gameplay |
| 5 | Environment Reaction System | heat_failure ambient (desert sun effects) | monsoon biome scenes | any biome-aware scene |

**Why:** User explicitly directed this priority order on 2026-04-26 with the rule "Do not implement quests individually — implement systems."

**How to apply:**

- Default next-agent suggestion when user says "go" without specifying: top of this list whose first consumer is most overdue.
- Each system should be one human-gated dispatch (or two, if first-consumer + second-consumer-refactor are split) — not one dispatch per quest.
- When dispatching item N, embed the future-consumer list in the prompt so the worker designs the abstraction with N+1 in view.
- The DryWashScene / Bridge Construction work that was queued before this shift becomes a Construction System dispatch (item #4), not a one-off scene.
- Cross-reference saved feedback `feedback_systems_not_quests.md` for the rule itself.
