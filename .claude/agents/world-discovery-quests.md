---
name: world-discovery-quests
description: Wires discovery events to the existing legacy quest system — discovering a region can unlock a related capability or quest line. Examples from the design spec — "reach river → unlock fluid physics", "reach mine → unlock metallurgy", "reach mountain → unlock force/gravity lessons". Cross-system glue, no new visual or data structures of its own.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the discovery-to-quest wiring layer.

## Files in scope

- `src/renderer/game/systems/discoverySystem.js` — add a small
  `onRegionDiscovered(callback)` event hook (additive only).
- `src/renderer/game/systems/questSystem.js` (or wherever quest
  registration lives — verify the actual file by grep before editing)
  — register listeners that fire `unlockQuest` / `unlockKnowledge` on
  discovery.
- NEW: `src/renderer/game/data/discoveryUnlocks.js` — small data file
  mapping `regionId → unlock specs`. Strict separation: data here,
  wiring code in the system files above.

## Out of scope

- Modifying the quest definitions themselves in `quests.js` (that's
  separate authoring work — this agent only wires discovery to
  EXISTING quests/knowledge).
- Fog/terrain rendering (other agents).
- Anything under `src/renderer/game3d/` (different engine).

## First cycle goal

1. Read `quests.js` to find existing quests with the right thematic
   match for the unlocks listed in the design:
   - River discovery → fluid physics quest (search for "fluid",
     "water", "buoyancy" in quest titles/categories)
   - Mine discovery → metallurgy quest (search for "metal", "ore",
     "copper", "alloy")
   - Mountain discovery → force/gravity quest (search for "gravity",
     "incline", "slope", "weight")
   For any unlock that has no matching existing quest, leave it as a
   TODO in `discoveryUnlocks.js` with a `pending: true` flag and
   surface the gap in the receipt's `notes`.
2. Create `discoveryUnlocks.js`:
   ```js
   export const DISCOVERY_UNLOCKS = {
     salt_river:  { unlockQuests: ['fluid_physics_intro'], pending: false },
     copper_mine: { unlockQuests: ['metallurgy_intro'],    pending: false },
     mountain_range: { unlockQuests: [],                    pending: true,
                       todo: 'Need a force/gravity intro quest' },
     // … one entry per region in regions.js
   };
   ```
3. Add `onRegionDiscovered(callback)` to discoverySystem.js — a tiny
   pub/sub. Listeners receive `{ regionId }`.
4. Register a listener in questSystem.js init that reads
   `DISCOVERY_UNLOCKS[regionId]` and calls the existing quest-unlock
   API for each entry. Don't reinvent the quest API — find the
   current `unlockQuest()` or equivalent and call it.

## Standards

- JavaScript only — no TypeScript.
- Don't modify `quests.js` content. Read-only on quest definitions.
- No new top-level dependencies.
- If an existing quest with the right theme doesn't exist, mark TODO
  and move on — don't author new quests this cycle (different agent's
  job).

## Receipt requirement

Write to: `.claude/swarm/receipts/world-discovery-quests-<ISO timestamp>.json`

Conform to `.claude/swarm/receipt-schema.json`. In `notes`:
- The exact mapping you established (region → unlocked quests)
- Any regions left with `pending: true` (and why — missing quest)
- The quest-system API you called (function name + signature)
- Confirmation that quests.js was not modified

Include `next_agent_suggestions: ["runtime-audit-system"]` to verify
the wiring after.
