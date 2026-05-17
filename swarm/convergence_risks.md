# Convergence Risks

The project is at risk from accumulation, not absence. Track these risks before merging lane work.

## Active Risk Register

| Risk | Severity | Symptoms | Integration Response |
| --- | --- | --- | --- |
| Too much visual clutter | High | Every scene has many props, particles, NPCs, and prompts competing | Cut or soften lower-priority details; preserve one clear focal path. |
| Too many overlays | High | HUD panels, prompts, and notifications cover authored world moments | Consolidate UI states and prefer quiet feedback. |
| Excessive particles | Medium | Repair, movement, and ambience effects become constant | Reduce frequency, opacity, duration, or scene count. |
| Excessive prompts | High | Text explains what the world could imply | Prefer environmental read; reserve prompts for action clarity. |
| Overwritten emotional pacing | High | Warm, calm moments are interrupted by rewards or effects | Let scenes breathe; use fewer beats with stronger placement. |
| UI dominating world | High | The player reads interface before place, bike, or character | Shrink, fade, delay, or anchor UI away from focal art. |
| Audio overcrowding | Medium | Music, ambience, loops, and stingers compete | Establish mix hierarchy and silence windows. |
| Too many environmental details | Medium | Story props lose meaning through quantity | Keep details with specific emotional intent; remove generic flavor. |
| Garage losing focal hierarchy | High | Tools, NPCs, bike, repair station, and UI all demand attention | Make the bike/workbench the primary read; stage supporting details quietly. |
| Neighborhood losing calmness | High | Street becomes busy, noisy, or over-signposted | Restore negative space, soft motion, and readable travel lanes. |
| BMX identity becoming noisy | High | Bike silhouette or rider identity is obscured by effects, props, or UI | Protect silhouette, repair readability, and grounded BMX feel. |
| Contradictory art direction | High | Lanes introduce mismatched tone, scale, palette, or prop density | Choose one visual language per scene and defer mismatched additions. |
| Cumulative overstimulation | High | Foundation overlays, story anchors, UI fades, audio cues, and NPC ambient lines all improve individually but become busy together | Require a combined playthrough before merging multiple polish lanes. |
| Memory/report lag | High | Implementation/audit files show progress while lane `report_latest.md` files remain pending | Block formal merge readiness until each lane records touched files, validation, and restraint decisions. |
| Garage over-authorship | High | Repair bike, workbench, props, warm pools, NPCs, prompts, rewards, and sound all converge on one room | Preserve the repair bike/workbench as first read; delay extra props or dialogue if they compete. |
| Neighborhood pocket overload | Medium | Every street area receives a named memory anchor, glow, pool, ambience, and NPC line | Keep the quiet road band and negative space as authored content, not empty space to fill. |
| Reward/pacing contradiction | High | Rewards are visually softened but validation still flags reward-intent assertions | Resolve reward-flow reliability before adding more completion ceremony. |
| Constitutional path mismatch | Medium | Requested `project_audit/art_direction_rules.md` is missing at repo root, while `BikeBrowserWorld/project_audit/art_direction_rules.md` exists | Treat the discovered file as active authority for now and create/relocate the root reference only with explicit integration approval. |

## Lane Overlap Analysis

| Overlap Zone | Lanes Involved | Risk | Current Governance |
| --- | --- | --- | --- |
| Garage focal area | Lane 1, Lane 3, Lane 4, Lane 5, Lane 7, Lane 8 | Repair visuals, warm staging, story props, prompts, audio, and NPC beats can all target the same space | Merge garage changes in small batches and review first read after each merge. |
| Neighborhood street | Lane 2, Lane 4, Lane 5, Lane 6, Lane 7, Lane 8 | Composition overlays, memory anchors, prompts, camera motion, ambience, and proximity lines can accumulate | Protect the quiet road band and keep prompt/dialogue/audio cadence sparse. |
| Repair completion | Lane 1, Lane 5, Lane 6, Lane 7 | Sprite state, HUD reward, tactile timing, and stingers all want payoff emphasis | Choose one primary payoff and keep the others supporting. |
| Dialogue/proximity pacing | Lane 5, Lane 7, Lane 8 | Dialogue reveal, quiet cues, ambient NPC lines, and UI timing can over-choreograph a simple conversation | Preserve silence between beats; test with audio enabled. |
| Runtime authority | Lane 7, Lane 8, integration docs | Audio and NPC work touch signals and dialogue paths near protected systems | Any change to core managers requires integration review before merge. |

## Current Restraint Enforcement

- Do not add new glow pools to the garage until current pool, prompt, repair sprite, and audio layers are reviewed together.
- Do not add more ambient NPC proximity lines until their cooldown and audio/dialogue rhythm are manually felt in play.
- Do not add new reward ceremony until reward-intent validation is stable.
- Do not fill the neighborhood quiet road band; it is serving pacing and should remain visually calm.
- Treat side regions as allowed to be simpler until the first slice is emotionally stable.

## Protected-System Drift

Any change touching protected core systems must be flagged in the lane report and reviewed by integration before merge:

- `Core/EventBus`
- `Core/DialogueManager`
- `Core/QuestRegistry`
- `Core/SaveService`
- `Core/RegionRegistry`
- `Core/RewardBridge`
- `RuntimeValidator`

## Convergence Rule

If a change makes the world more impressive but less emotionally readable, it is not ready to merge.
