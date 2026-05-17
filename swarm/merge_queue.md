# Merge Queue

Updated: 2026-05-16 - Post Reward Stabilization Reassessment

## Queue Policy

Formal readiness requires a populated lane report, validation evidence, touched file list, overlap review, and reduction decision. Reward validation is now stable, but lanes 1-8 still need current swarm reports before implementation merges.

Phase 3 adds one more gate: if a lane increases emotional density in garage, neighborhood, reward moments, dialogue cadence, UI presence, or audio presence, it must identify what becomes quieter or simpler before it can merge.

## Recommended Merge Order

1. Lane 9 integration docs.
2. Reward validation stabilization - complete.
3. Lane 1 bike readability, only if repair completion stays understated and no new payoff stack is introduced.
4. Garage first-read reduction check, before accepting any garage staging/storytelling additions.
5. Lane 2 foundation composition, after confirming quiet road band remains protected.
6. Lane 5 UI and Lane 7 audio as a paired pacing review, not separate polish wins.
7. Lane 6 camera/game feel after visual hierarchy is stable.
8. Lane 3 garage staging only after a prop/light reduction list exists.
9. Lane 4 storytelling only after foundation and garage density are reviewed.
10. Lane 8 NPC humanization only after UI/audio/dialogue cadence is proven calm.

## Lane Readiness

| Lane | Current State | Merge Readiness | Dependency Blockers | Conflict Risks | Recommended Order |
| --- | --- | --- | --- | --- | --- |
| Lane 1 - Bike readability + repair visuals | Strong identity contribution; repair bike is a project anchor | NEXT_MERGE_CANDIDATE | Needs lane report, manual repair-state playtest, completion-cue restraint decision | Garage staging, reward glint, audio stingers, UI prompts | 3 |
| Lane 2 - Foundation environment + composition | Valuable visual flow; composition defines where attention belongs | NEEDS_CONVERGENCE_REVIEW | Needs lane report and proof quiet road band remains calm | Neighborhood over-layering, garage threshold over-emphasis | 4 |
| Lane 3 - Garage emotional staging | Emotionally successful but most overworked zone | HIGH_CONFLICT_RISK | Needs lane report, first-read review, and prop/light reduction list | Bike/workbench/NPC/UI/audio/story all compete in garage | 7 |
| Lane 4 - Environmental storytelling | Adds memory but has highest duplicate-emotion risk | HIGH_CONFLICT_RISK | Needs lane report, density review, and proof details do not explain what staging already says | Too many named anchors, garage clutter, NPC/dialogue duplication | 8 |
| Lane 5 - UI / HUD polish | Direction is restrained and world-first | NEEDS_CONVERGENCE_REVIEW | Needs lane report and rendered playthrough with audio/NPCs active | Prompt timing/panels may still compete with world first-read | 5 |
| Lane 6 - Camera + game feel | Supports tactile comfort but depends on final visual hierarchy | WAITING_ON_OTHER_LANE | Needs lane report, visual hierarchy locked, manual movement review | Camera can fight composition; micro-delays can stack | 6 |
| Lane 7 - Audio immersion | Strongest restraint evidence; still requires listening pass | NEEDS_CONVERGENCE_REVIEW | Needs lane report and real listening pass | Quiet windows can stack with UI/NPC delays; reward cue near failing assertions | 5 |
| Lane 8 - NPC humanization | Warm and identity-aligned but sensitive to over-narration | NEEDS_CONVERGENCE_REVIEW | Needs lane report, cooldown playtest, dialogue density review | Proximity lines can fill silence; NPC warmth can duplicate environmental story | 9 |
| Lane 9 - Integration | Swarm infrastructure and governance docs only | READY_FOR_INTEGRATION | None for docs | Must remain non-feature lane | 1 |

## Current Merge Blockers

- Missing lane reports for lanes 1-8.
- Missing root constitutional file path: `project_audit/art_direction_rules.md`.
- Reward validation blocker is cleared:
  - RuntimeValidator: 0 errors.
  - `runtime_repair_smoke.gd`: PASS.
  - `vertical_slice_check.gd`: PASS.
- Untracked `BikeBrowserWorld/` tree makes protected-system diff ownership unclear.
- No combined rendered playthrough evidence for UI, audio, NPC, and visual density together.

## Post-Stabilization Ruling

- Reward validation stabilized without RewardBridge, QuestRegistry, EventBus, RuntimeValidator, scene, layout, asset, UI, audio, or NPC presentation changes.
- Broader integration may begin narrowly, starting with Lane 1 bike readability.
- Broad polish remains paused.
- Reward presentation remains frozen unless a lane explicitly passes payoff cue review.

## Lane Advancement Status

| Lane | Sprint 1B Status | Advancement Rule |
| --- | --- | --- |
| Lane 1 - Bike readability | Resume narrowly | May proceed as next merge candidate after report, manual repair-state inspection, and payoff cue restraint. |
| Lane 2 - Foundation | Paused until Lane 1 + garage first-read check | May resume after reward validation and quiet-band review. |
| Lane 3 - Garage | Reduce-only, no merge yet | Must wait for garage first-read inspection. |
| Lane 4 - Storytelling | Paused | Must wait for duplicate-emotion review. |
| Lane 5 - UI | Reduce-only, no reward escalation | Must not modify reward presentation during stabilization. |
| Lane 6 - Game feel | Waiting | Must wait for visual hierarchy after Lane 1 / garage first-read review. |
| Lane 7 - Audio | Reduce-only, no new stingers | Must not modify reward audio during stabilization. |
| Lane 8 - NPCs | Paused | Must not add praise/ambient reward lines. |
| Lane 9 - Integration | Active | Owns dispatch governance and validation oversight. |

## Phase 3 Pause Rules

- Pause new garage props, glow pools, and NPC beats until garage first-read is reviewed.
- Pause new neighborhood memory anchors until quiet road band is confirmed in play.
- Pause new reward ceremony until reward-intent validation passes.
- Pause new ambient NPC lines until UI/audio cadence is reviewed together.
- Pause side-region expansion until first-slice emotional rhythm is stable.
