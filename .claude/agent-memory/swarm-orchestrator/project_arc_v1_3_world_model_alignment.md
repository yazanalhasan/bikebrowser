---
name: arc.md v1.3 world model alignment + knowledge state
description: arc.md v1.3 (2026-04-27) added Section 8 World Model Alignment Layer as non-negotiable; Knowledge State System declared foundational unbuilt with design-before-consumption gate.
type: project
---

arc.md v1.3 (2026-04-27) added two non-negotiable architectural rules
that affect every future dispatch prompt.

**Why:** the engine systems already shipped (`world-biome-classifier`,
`world-discovery-state`, `world-terrain-renderer`, `world-landmarks`)
were drifting away from the three-act narrative arc with no formal
binding. v1.3 closes the gap by elevating the world model primitives
to architectural constraints alongside the existing carry-forward
systems rules in Section 4. Also formalizes the Knowledge State
System as a foundational primitive that other systems will
eventually depend on — premature consumption (hardcoding queries
before the data model exists) would create the same fragmentation
the document is trying to prevent.

**How to apply:**

1. **Section 8 is non-negotiable.** Frontmatter for any future
   dispatch prompt that creates or modifies a carry-forward system
   must explicitly declare:
   - Which environmental primitives the system consults
     (biome, terrain).
   - Which progression primitives the system updates
     (discovery state, knowledge state, landmarks).
   - How it scales Act 1 → Act 3 without diverging across acts.
   Agents that don't declare these must halt-and-surface, not
   improvise.

2. **No act-specific carve-outs to carry-forward systems.** A
   "for Act 3 only" branch in a portable system is now an
   explicit halt-and-surface trigger. The acts are layers of
   capability over one continuous world, not separate games.

3. **No biomes or landmarks added without an educational domain.**
   Visual-variety-only additions halt-and-surface. Each biome
   carries a primary curriculum domain (desert→heat/water/silica;
   savanna→ecology/ironworking; subtropical highland→traditional
   medicine + rare earths; etc.). Each landmark anchors a system
   or concept (broken bridge→structural eng; mine→metallurgy;
   greenhouse→biology workbench; observatory→spaceflight).

4. **Terrain is a constraint engine, not decoration.** Future
   construction/movement/foraging/UTM agents must consult terrain
   (sand→unstable foundations; rock→strong anchors; ice→brittle;
   volcanic→thermal damage). Terrain-blind systems halt-and-surface.

5. **Knowledge State System is unbuilt and gated.** Three-state
   model — Seen / Interacted / Understood — to be declared in a
   future `knowledge-state-substrate.md` design document. NO
   system may consume knowledge-state queries before that design
   doc lands. If a quest/crafting/dialog agent needs "does the
   player understand X?" the dispatch must halt-and-surface for
   the design-doc work first. Discovery state (geographic) and
   knowledge state (conceptual) are explicitly distinct data
   models with distinct query APIs — conflating them is a
   halt-and-surface trigger.

6. **New out-of-scope item:** "Systems that fragment world model
   primitives." Reviewers checking scope should now treat
   primitive bypass as a CRITICAL violation, not MEDIUM.

**Audit implication for existing systems:** the carry-forward
systems already shipped (Construction, UTM, Thermal Rig,
Chemistry Lab, Inventory, Quest Engine) likely don't yet declare
their primitive interactions explicitly. This is a known gap, not
a regression — future modifications to those systems should add
the declaration as part of the work, not as a separate audit
sweep.

**Document version pinning:** this memory anchors to arc.md v1.3
specifically. If v1.4 changes Section 8 semantics or rewrites the
Knowledge State Section, this memory must be re-read against the
new doc and rewritten or deleted. Don't apply v1.3 rules to v1.4+
without re-confirmation.
