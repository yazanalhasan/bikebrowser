# Dialogue Tone Report

Generated: 2026-05-15

## Tone Target

The vertical slice should feel like a warm Sonoran neighborhood at dusk: safe, tactile, observant, and quietly encouraging. Dialogue should sound spoken by people who live here, not by systems explaining objectives.

## Before And After Direction

Before:

- longer instructional lines
- more explicit repair teaching
- occasional "quest dispenser" phrasing
- success text that sounded like task completion

After:

- shorter turns
- more sensory language
- warmer pauses
- subtle suggestions instead of commands
- restrained pride after progress

## Pacing Changes

Lines were shortened so younger players can read them comfortably. The primary slice now uses smaller beats:

- notice the sound
- look before touching
- try the next small action
- acknowledge the result

This keeps the interaction breathable and lowers pressure.

## Humanization Patterns Used

- Replace instruction with observation: "The chain is trying to climb sideways."
- Replace objective framing with invitation: "Come to the garage with me."
- Replace overpraise with noticing: "Mrs. Ramirez smiles like she already knew you'd be careful."
- Replace exposition with local metaphor: "Bridges are like bikes that hold still."
- Keep science, but make it conversational: "The river's chatty today."

## NPC Consistency

Mr. Chen, Mrs. Ramirez, Mom, Neighbor Kid, Old Miner Pete, Ranger Nita, and Dr. Maya now fit a shared emotional world:

- calm adults
- patient mentors
- curious children
- neighborhood familiarity
- desert and river specificity

No NPC was given harsh sarcasm, exaggerated slang, or high-pressure urgency.

## Readability Check

Most rewritten lines are one or two short sentences. Technical terms remain only where they feel grounded in character voice:

- sprocket
- pH strip
- copper
- stoneflies

These terms are surrounded by natural speech rather than lecture blocks.

## Validation Plan

Recommended validation for this pass:

1. Run Godot headless validation on `NeighborhoodStreet.tscn`.
2. Run Godot headless validation on `ZuzuGarage.tscn`.
3. Confirm dialogue normalization count stays stable.
4. Play the first 15 minutes manually and listen for:
   - awkward phrasing
   - lines that feel too long
   - NPCs that still sound like objectives
   - progression moments that feel overdone

## Remaining Robotic-Feeling Dialogue

The most likely remaining rough spots are outside the first slice:

- some mission descriptions still say "Talk to..." or "Report..."
- some non-priority NPC intro files still use direct educational phrasing
- reward text still uses explicit earned-badge language in mission data

These can be softened in a later wider UI/objective copy pass.

