# BLOCKED_NEEDS_DESIGN: bridge_quest_2

Sprint: 7
Quest: bridge_quest_2
Title: Gather Materials

## Blocking Reason

bridge_quest_2 requires objective talk_to_shopkeeper, described as "Ask the Shopkeeper which materials are safe to reuse."

The live project currently has no reachable Shopkeeper NPC, scene-side interaction, or dialogue target for that NPC. Wiring this objective to Mr. Chen or another existing character would change story ownership and violates the overnight rule against inventing or redirecting story content.

## Additional Data Gaps

The quest completion conditions reference:

- wood_plank
- metal_bracket
- rope_coil

wood_plank exists in BikeBrowserWorld/Data/items/items.json. The live item catalog currently has metal_strip and fiber_rope, but not exact ids metal_bracket or rope_coil.

## Overnight Decision

Do not implement a placeholder material-gathering station tonight. Leave the quest as DATA_ONLY and carry it into next-day design triage.

## Recommended Daytime Fix

1. Decide whether the Shopkeeper NPC should exist, or whether the quest JSON should be revised to Mr. Chen.
2. Add exact item ids or revise completion conditions to existing item ids.
3. Then wire material pickups/deposit station in neighborhood/garage/dry wash.
