# Game Design Source Of Truth

Date: 2026-05-27

## Purpose

This document is the rebuilt Phaser game's canonical design reference. Existing scenes are behavioral references only. The game should be built from the world, quests, characters, and educational beats documented here.

## Main Character

Zuzu is the player character: a curious, brave, kind, mechanically interested Sonoran dry-wash explorer.

Core visual identity:

- short brown hair with warm highlights
- bright yellow shirt with small red/blue pattern marks
- soft gray pants
- muddy shoes/ankles
- optional explorer stick for outdoor scenes
- upright, friendly, curious silhouette

Core verbs:

- walk/explore
- inspect
- talk
- repair
- test materials
- collect evidence
- record observations
- build or improve local structures

## Core World Premise

BikeBrowser+ is a 2D educational adventure where a child begins by repairing and upgrading bikes in the Sonoran Desert, helps reconnect local places, learns through useful tools, then eventually scales those same systems into global resource and space-engineering problems.

The learning thesis:

- introduce abstract systems as concrete tools
- reuse tools at increasing complexity
- make failure visible and useful
- treat science as something the player does, not hears about

## Act 1 Core

Setting:

- Phoenix/Tempe/Scottsdale-inspired Sonoran neighborhood
- garage/workbench home base
- neighborhood streets and bike paths
- dry wash
- broken bridge
- desert trail
- Salt River
- copper/rock/mining evidence locations

Player goal:

- repair and use a bike
- help local mentors/neighbors
- understand why the bridge/dry-wash connection matters
- test materials
- learn local ecology and resource constraints
- unlock broader travel and systems thinking

## Major Locations

| Location | Purpose |
| --- | --- |
| Garage / Workbench | emotional home base, repair, crafting, material testing |
| Neighborhood Street | first social/exploration space, Mrs. Ramirez, bike/safety interactions |
| Dry Wash | bridge problem, flood/terrain constraint, desert ecology |
| Bridge Site | structural engineering, triangles, material choice |
| Desert Trail | plants, heat, water, foraging ethics |
| Salt River | water quality, pH, macroinvertebrate evidence |
| Copper Mine / Rock Site | materials evidence, conductivity, copper usefulness |
| World Map | later region expansion and discovery |

## Quest Arcs

### First 15 Minutes

1. Start in warm garage.
2. Meet Mr. Chen.
3. Find and repair a bike problem.
4. Learn the inspection/repair grammar.
5. Exit toward neighborhood and bridge problem.

### Act 1 Bridge / Dry Wash Arc

Intended beats:

- bridge is broken or unsafe
- neighbors care because it blocks movement/access
- player learns materials matter
- player tests wood/steel/aluminum/rubber/composite/rope
- player learns triangles/load paths
- player helps reconnect the neighborhood

### Bike Repair Arc

Intended beats:

- bike is a concrete system
- chain/brake/tire problems have visible causes
- repair actions show state change
- tools and tests matter
- final verification is required

### Regional Science Arc

Intended beats:

- desert plants are identified by evidence, not trivia
- water quality is tested by sample/strip/chart/organisms
- copper is useful because conductivity can be observed

## Educational Mechanics

Reusable mechanic pattern:

```text
real-world tool -> simplified visible rig -> player action -> observed response -> notebook/evidence artifact -> quest progress
```

Key mechanics:

- bike inspection and repair
- material testing / UTM
- bridge load-path reasoning
- water quality evidence
- plant identification
- conductivity testing
- inventory/tool use
- dialogue-gated mentorship
- notebook evidence

## NPCs

Known first-pass roles:

- Mr. Chen: garage mentor, engineering habits, repair/testing guide.
- Mrs. Ramirez: neighborhood witness/neighbor, bike or bridge problem connection.
- Zuzu: player learner, mechanic/explorer.

Future NPC roles should be anchored to place, tool, and learning purpose. Do not add cultural content beyond committed high-level language tracks without human-authored briefs.

## Objects And Tools

First substrate objects:

- Zuzu avatar
- bike
- tire/chain/brake repair station
- patch kit
- single patch
- pump/hose
- tire levers
- material samples: wood, steel, aluminum, rubber, composite, rope
- notebook
- bridge parts
- pH strip/sample jar/chart
- plant cards
- copper rock/probe/light

## Environmental Motifs

- warm garage light
- sawdust, rubber, chain oil
- dusk street light
- desert plants and rocks
- dry wash paths
- small kid-made ramps/chalk marks
- bike tracks
- simple evidence boards
- notebook sketches

## Mood And Tone

Warm, grounded, tactile, serious but playful.

The game should feel like a real child-adventure world, not a dashboard, lesson app, or generic fantasy RPG.

## Eventual Visual Fidelity

Target:

- readable top-down adventure style
- warm Sonoran dusk palette
- strong silhouettes at child-readable scale
- tactile repair props
- clean authored sprites and tile kits
- final production art authored or cleaned through Aseprite-style discipline

Current rebuild fidelity:

- clean geometric placeholders
- stable scale and palette
- no messy migrated art
- no over-polish
- no unreviewed generated output

## First Clean Placeholders

Implement first:

- Zuzu placeholder
- bike placeholder
- house/garage/street/desert wash/bridge placeholders
- repair station
- NPC/sign
- quest and interaction markers
- dialogue bubble
- inventory/tool item

These placeholders are not production art. They are trustworthy scaffolding for gameplay, tests, and future art replacement.
