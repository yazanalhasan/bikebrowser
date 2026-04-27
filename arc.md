# arc.md — BikeBrowser+ Strategic Vision Document

## How to use this document

This is the strategic vision document for **the game module of
BikeBrowser+**. The application as a whole has four pillars (see
Context section below). This document covers the game pillar.

**For Claude Code sessions:** read this before any architectural work.
For tactical playbooks see `.claude/plans/`. For active bug
investigations see `.claude/bugs/`. For per-system design specs see
the system-specific design documents (e.g., `biology-substrate.md`
when written).

**For human design sessions:** Section 6 (Open Design Questions) is
the worklist. The document deliberately surfaces what hasn't been
decided rather than papering over it.

**For agents proposing implementations:** the rules in Section 4
("Architectural Discipline") are non-negotiable. Any dispatch that
violates them should halt-and-surface rather than proceed.

---

## Context: BikeBrowser+ as a whole

BikeBrowser+ is an integrated educational learning environment built
for one specific 9-year-old. The application has four major pillars:

1. **Discovery** — safe, AI-reranked YouTube search with learning
   progress tracking and topic-aware recommendations. Routes through
   `services/rankingEngine.js` with weighted features (relevance,
   educational signals, complexity, entertainment penalty).

2. **Building Tools** — Project Builder (video → mission), Build
   Planner (AI-driven build specifications via aiOrchestrator),
   Saved Notes (cross-project sourcing aggregator), Shop Materials
   (price comparison across Amazon, eBay, Walmart, local stores via
   Google Places).

3. **Safe Search** — multimodal access via voice and camera for a
   pre-typing-fluent user, routing into Discovery, Building, and
   Shopping pipelines.

4. **The Game** (this document's focus) — Phaser 2D educational
   adventure with the desert-to-space arc described below. Currently
   intentionally siloed from the browser pillars, sharing only
   AppLayout, AI provider routing, and Electron IPC plumbing.

**Cross-pillar opportunities exist but are deliberately out of scope
for this document.** Examples worth eventual consideration: Build
Planner real-bike specifications informing in-game spacecraft
modules; learningStore (browser) and saveSystem (game) cross-
pollination so videos watched outside the game count toward in-game
knowledge; voice/camera input from Safe Search routing into in-game
quest interactions for a pre-literacy player.

These are flagged here so future architectural decisions about the
game don't accidentally foreclose them. Any feature that would
prevent eventual cross-pillar integration should halt-and-surface.

The user this is built for engages with all four pillars. The game
is curriculum content, not a side feature. Bugs in the game module
matter at the same severity as bugs in any other learning surface.

---

## 1. North Star

BikeBrowser+ is an educational 2D Phaser game where the player
begins as a child repairing and upgrading bikes in the Sonoran
Desert, expands through six regionally-grounded Earth biomes —
each with a real culture, language, and resource identity — and
ultimately engineers life and ecosystems on an alien planet.

The game teaches systems thinking by letting the same core toolkit
scale upward: a broken bridge becomes structural engineering, a
material test becomes spacecraft safety, a foraged desert plant
becomes pharmacology and ecology, and a local language lesson
becomes a mechanism for accessing culture, trade, trust, and
scientific knowledge.

---

## 2. Core Premise

The core educational thesis is that children learn complex science
best when abstract systems are introduced first as useful tools in
a concrete world, then reused at increasing complexity.

The player should not learn "materials science" as a lecture. They
should need a stronger bridge, test wood, aluminum, steel,
composite, and alien materials, watch failures happen, improve the
design, and gradually understand stress, strain, stiffness,
brittleness, density, fatigue, heat tolerance, corrosion, and cost.
This is the **Universal Testing Machine pattern** — take a real
scientific or engineering instrument, simplify it into a visually
understandable game mechanic, and let the child discover the
principle by using it to solve an actual problem. **Every other
system in the game should follow this pattern.**

The desert-to-space arc works because each environment raises the
constraints. The Sonoran Desert is local, understandable, and
resource-constrained — bike, forage, repair, build, talk to
neighbors. Other Earth regions expand the resource map and the
cultural map: tin, iron, rare earths, medicinal plants, geothermal
energy, biological diversity, and six concrete language traditions.
Space then removes Earth's assumptions: no breathable air, no
familiar plants, no Earth-like soil. The same toolkit becomes more
rigorous because it has to.

The intended learner is a curious child, roughly upper-elementary
to middle-school, but the design should not be childish. It should
feel like a serious adventure game with playful characters,
readable systems, and escalating complexity. Adults should be able
to appreciate the simulation logic.

The embedded values are:

- Respect for real science without overwhelming the player.
- Learning by doing rather than memorizing.
- Cultural authenticity rather than superficial decoration.
- Ecology and stewardship rather than extraction-only gameplay.
- Dose-response thinking in medicine and chemistry.
- Engineering failure as feedback, not punishment.
- Language as access to relationships and knowledge, not a
  vocabulary quiz.
- Progression from repair → construction → experimentation →
  design → simulation → creation.

**Cultural representation rule:** decisions about specific
indigenous, religious, or marginalized cultural content require
explicit human design input. No agent should generate such content
without a human-authored design brief specific to that culture and
context. The Quechua, Arabic, Turkish, Kurdish/Persian, Swahili,
and Mandarin language tracks are committed canon (see Section 5),
but the *content* placed in those cultural contexts requires
deliberate human design.

---

## 3. The Three Acts

### Act 1 — Sonoran Desert / Bike School / Local Systems

**Setting:** the Sonoran Desert, inspired by the Phoenix/Tempe/
Scottsdale region of Arizona. Visual identity: desert washes,
saguaros, palo verde, mesquite, creosote, dry riverbeds, rocky
hills, neighborhood streets, garages, bike paths, small workshops,
local stores, and a broken bridge connecting two neighborhoods.
The starting world is local and grounded. The player is a kid with
a bike, a garage workbench, local mentors, neighbors, and
increasingly sophisticated tools.

**Player goal:** repair, upgrade, and use a bike to explore the
local desert/neighborhood world, reconnect separated areas, help
NPCs, and unlock the first major engineering pathway. The broken
bridge is the early structural challenge — emotionally
understandable, physically visible, mechanically expandable.

**What the player learns:**

- Basic bike mechanics: wheels, brakes, gears, chain, frame, tires,
  suspension, torque, friction.
- Desert ecology: heat, water, shade, native plants, animal
  habitats, washes, monsoon logic.
- Foraging and identification: useful plants, unsafe plants,
  ecological limits, harvest ethics.
- Basic chemistry: mixing, extraction, solubility, concentration,
  pH, heat, drying, crystallization.
- Dose-response thinking: beneficial vs harmful quantities,
  medicine vs poison, safe handling.
- Materials basics: wood, stone, metal, rubber, plastic,
  glass/silica, copper, turquoise.
- Construction basics: beams, supports, triangles, load, balance,
  bridge stability.
- Navigation and discovery: fog-of-war style map revealing
  explored areas.
- Community systems: NPC trust, local quests, trading, cultural
  access.

**Languages introduced in Act 1:** English (UI primary), Spanish
(natural to Arizona/Southwest), Arabic (the first intentional
non-English learning layer, introduced through a family or
mentor character whose dialogue and cultural cues use Levantine
flavoring).

**Systems introduced:** bike movement and upgrade, garage/
workbench, inventory and foraging, basic materials lab, UTM rig,
thermal rig, construction system (bridge-focused), quest engine
and NPC dialogue, region discovery / fog-of-war map, language
interaction layer.

**What carries forward:** bike + upgrade history; garage as
conceptual home base; materials testing paradigm; tools-can-be-
reused-in-new-environments principle; bridge construction logic;
plant/chemistry/dose-response knowledge; NPC relationships;
language layer; map discovery mechanics.

**What ends or becomes less central:** the purely local
neighborhood framing recedes after Act 1. The bike remains
important but eventually becomes one vehicle among others. Simple
repair quests taper into more complex design quests.

**Completion criteria:** bike repaired/upgraded enough to access
the wider map; bridge reconnected (or alternative built); basic
material testing demonstrated; initial ecology/foraging/chemistry
quests completed; sufficient NPC trust to unlock broader Earth
regions; first "systems upgrade" unlocked (regional travel,
advanced workbench access, or first spacecraft-related clue).

### Act 2 — Earth Expansion / Global Resources / Spacecraft Engineering

**Setting:** an explicitly geographic 2D map covering six committed
regions plus the Sonoran starting region. The player learns that
no advanced machine comes from one place. Spacecraft require
distributed resources, specialized knowledge, different cultures,
and different environments.

**The seven committed regions** (per `data/regions.js` and
`data/languages.js`):

| Region | Biome | Language(s) | Signature resources |
|---|---|---|---|
| Sonoran Desert (starting region) | desert | English, Spanish, Arabic | copper, turquoise, silica, quartz |
| Mexico & Andes | highland | Quechua + Spanish | silver, lithium brine, obsidian, copper, gold |
| Arabian Region | desert | Arabic (Levantine + Classical) | gold, copper, rock salt, phosphate, frankincense resin |
| Anatolian Plateau | steppe | Turkish | iron, copper, boron, marble |
| Zagros / Iranian Plateau | mountain steppe | Kurdish + Persian | copper, zinc, lead, turquoise, lapis lazuli |
| East African Savanna / Swahili Coast | savanna | Swahili | iron, gold, tanzanite, garnet |
| Yunnan / Xishuangbanna | subtropical highland | Mandarin | iron, tungsten, rare earths, jade, coal |

**Note:** `data/regions.js` includes additional regions
(Pakistan, Malay Archipelago) for future expansion. These are
canon-eligible but not part of the committed Act 2 design until
their language/cultural content is authored by a human.

**Player goal:** build a spacecraft by solving modular engineering
problems across the committed regions. Not "collect 10 parts" —
modular subsystems:

- Frame/hull
- Thermal shielding
- Propulsion
- Power
- Guidance/navigation
- Life support
- Communication
- Landing system
- Biological payload or greenhouse module
- Materials certification

Each module requires a different region, material, test, language/
cultural interaction, and scientific principle.

**What the player learns:**

- Metallurgy: ore → metal → alloy → tested component.
- Steel composition: iron + controlled carbon; optional Cr/Ni/Mn/Mo
  for specialized properties.
- Electrical systems: copper wiring, batteries, motors, sensors.
- Thermal engineering: insulation, conduction, radiation, heat
  shields.
- Chemistry: refining, smelting, oxidation/reduction, corrosion.
- Mechanical design: load paths, redundancy, fatigue, safety
  factors.
- Ecology and resource ethics: extraction has consequences.
- Geography: resources are unevenly distributed.
- Language: technical knowledge is embedded in cultures and
  communities.
- Project management: complex machines are built from
  interdependent subsystems.

**Systems introduced or expanded:** construction system scales
bridge → vehicle modules → launch structures; UTM scales to
aerospace-grade components; thermal rig scales to re-entry/space
extremes; chemistry lab scales to refining/alloys/fuels/polymers;
**biology workbench appears in its first serious form** (recipe
biology in Act 1, parametric biology unlocking here); quest engine
supports multi-region quest chains; language layer gates trust,
trade, recipes, and advanced knowledge; map becomes a global
resource map; inventory becomes supply-chain aware.

**What carries forward:** tested material database; learned
recipes/alloys/engineering rules; multilingual relationships;
spacecraft modules and design choices; biological samples/seeds/
microbes; ethical decisions about extraction and ecology; the
test-before-trust principle.

**What ends or becomes less central:** local bike repair recedes;
individual resource gathering becomes more abstract once the
principle is understood; simple bridges no longer the main
challenge — bridge logic becomes part of larger structural systems.

**Completion criteria:** all required spacecraft modules built and
tested; hull, power, thermal, propulsion, life-support, navigation
pass minimum tests; sufficient language/geography quests for
global cooperation; biological/ecological payload chosen or
prepared; launch readiness unlocked.

### Act 3 — Alien Planet / Terraforming / Life Engineering

**Setting:** an alien planet or moon. Unfamiliar but not random.
Coherent ecology/physics: unusual atmosphere, different gravity,
unfamiliar minerals, strange light cycles, non-Earth soil
chemistry, unknown water availability, possibly native microbial
or prebiotic systems.

**Player goal:** establish a sustainable living system on an alien
world. Not "build a base." A viable ecological loop:

- Shelter
- Energy
- Water
- Air
- Soil/substrate
- Microbes
- Plants
- Waste recycling
- Food
- Environmental monitoring
- Ethical limits on engineered life

**What the player learns:**

- Closed-loop ecology
- Terraforming constraints
- Atmosphere composition
- Soil chemistry and nutrient cycles
- Microbial ecology
- Plant adaptation
- Genetic/biological engineering at age-appropriate level
- Feedback loops and unintended consequences
- Simulation before deployment
- Risk, containment, reversibility, and stewardship

**Systems introduced or expanded:** UTM tests alien materials;
thermal rig tests alien heat/cold cycles; construction system
builds habitats, domes, bridges, towers, greenhouses; chemistry
lab analyzes alien soil/atmosphere; **biology workbench reaches
its simulation form** (see Section 4 — Biology Workbench);
language system may extend into alien semiotics or maintain
human multilingual continuity (decision pending — see Section 6);
map discovery becomes planetary exploration; quest engine becomes
settlement/ecosystem milestones.

**What carries forward:** desert heat knowledge → thermal extremes;
bridge construction → habitat construction; foraging → ecological
sampling; dose-response → environmental concentration thresholds;
language learning → decoding unfamiliar communication; material
testing → survival-critical; chemistry → atmosphere/soil
engineering; bike exploration → rover/exosuit/vehicle exploration.

**What ends or becomes less central:** Earth geography becomes
background. Simple material collection gives way to modeling and
testing.

**Completion criteria:** Act 3 ends with the creation of a stable,
monitored, sustainable ecological system. Not "defeat a boss."
Possible criteria: habitat survives multiple alien day/night
cycles; greenhouse maintains stable air/water/nutrient loops;
designed microbe/plant system improves the environment without
runaway harm; player restores or creates a small biome; player
demonstrates stewardship — sustainable balance over maximum growth.

---

## 4. Carry-Forward Systems

### Architectural Discipline

These rules apply to every system in this section. They are
non-negotiable. Agents modifying carry-forward systems should
halt-and-surface rather than violate them.

- **Carry-forward systems** live in `src/renderer/game/systems/`
  with **no scene imports**. Systems do not know what scene they
  are mounted in.
- **Scene-specific content** lives in `src/renderer/game/scenes/`
  and may import from `systems/` and `data/`. Scenes never modify
  system internals.
- **Data definitions** live in `src/renderer/game/data/` and may be
  imported by both scenes and systems. Data is canonical; behavior
  derives from data, not vice versa.
- **Layout positions** live in `public/layouts/` and are loaded at
  runtime by `loadLayout()`. They are not imported.
- **Quest definitions** live in `data/quests.js`. Quest steps refer
  to systems and data, not to scenes by hard-coded reference.

**Note on current state (2026-04-27):** the quest engine has known
violations of this discipline — observe-step gating is not
implemented and observation emissions are hard-coded into specific
scenes (see `.claude/bugs/2026-04-27-quest-engine-and-traversal.md`).
Future quest work must move toward this discipline, not away from it.

### Construction System

Today: drag/drop bridge pieces, evaluate stability, validate load
paths.

Scales to: bike ramps, water channels, towers, spacecraft frame,
launch supports, habitat modules, alien greenhouse structures.

Discipline: separate construction logic from scene art. Bridge,
spacecraft truss, and habitat frame all use the same underlying
concepts: connection points, material properties, load paths,
supports, failure conditions, validation.

### Materials Lab / UTM Rig

Today: place a sample, see how it behaves under tension/compression/
load. Real engineering as playable learning. **This is the
canonical reference pattern for every other instrument-based
system in the game.**

Scales to: bike frame materials, steel alloy testing, heat shield
testing, spacecraft hull certification, alien material testing.

Discipline: material properties live in data, not hard-coded per
quest. Material schema includes density, tensile strength,
compressive strength, elasticity, brittleness, thermal expansion,
conductivity, corrosion resistance, cost/availability.

### Thermal Rig

Today: heat effects in the desert — expansion, melting, insulation,
cooling, heat damage.

Scales to: tire/brake performance, electronics cooling, re-entry
shielding, cryogenic environments, alien day/night extremes,
greenhouse thermal regulation.

Discipline: heat is a general property interaction system, not a
one-off hazard.

### Chemistry Lab

Today: plants, minerals, solvents, dyes, medicinal extracts,
simple reactions.

Scales to: plant extraction, dose-response medicine, smelting/
refining, alloy creation, battery chemistry, fuel/propellant
concepts, soil and atmosphere analysis, terraforming chemistry.

Discipline: every recipe teaches a principle. Avoid recipe-list
gameplay.

### Biology Workbench

Not yet built. Will become one of the most important systems.
**Designed using the UTM pattern: a real scientific instrument
(or rather, a progression of instruments) simplified into a
visually understandable game mechanic that the child uses to
solve actual problems.**

The biology workbench is a single system that progresses through
three modes. Each mode is more powerful and more abstract than
the last. Each mode is unlocked by demonstrating competence in
the previous one. The player does not switch tools — the tool
deepens.

#### Stage 1 — Recipe Biology (introduced Act 1, dominant Act 1–early Act 2)

The UTM analog: place known inputs, observe known outputs.

The player combines:

- Seed + water + light + soil → plant growth.
- Microbe + nutrient + temperature → bacterial culture.
- Plant extract + solvent + dose → tincture.

The workbench shows the inputs as discrete items dropped into
named slots, runs a visible process (germination timeline,
fermentation curve, extraction yield), and produces a tagged
output. Failure modes are visible: too dry, too cold, wrong
solvent, bad ratio.

Teaches: living systems require conditions. Inputs matter.
Some combinations work; most don't.

#### Stage 2 — Parametric Biology (unlocked Act 2, dominant Act 2)

The UTM analog: same instrument, but now the dials are exposed.

The player adjusts variables on the same workbench:

- Temperature, pH, salinity
- Water availability, light wavelength/intensity
- Nutrient concentration, oxygen/CO₂ balance
- Growth rate vs resilience tradeoff

The workbench renders a parameter space. The player runs trials
to find optimal conditions for a given organism, or discovers
that two desirable traits trade off against each other. Failure
modes become more nuanced: an organism survives but doesn't
thrive; a culture grows but is unstable; a plant adapts to one
parameter but becomes vulnerable in another.

Teaches: biology is parameter-sensitive, not magical. Trade-offs
are real. Optimization in one dimension may break another.

**Unlock trigger** (open question — see Section 6): likely
quest-gated by demonstrating a successful Stage 1 recipe under
varied conditions, then unlocked narratively when the player needs
parametric work for a spacecraft life-support module or
greenhouse. The decision affects when this stage's UI surfaces.

#### Stage 3 — Simulation Biology (unlocked Act 3, dominant Act 3)

The UTM analog: same instrument, but now you can run an entire
ecosystem in silico before deploying it.

The player tests organisms or ecosystems in a simulator before
release:

- Does the organism survive?
- Does it overgrow?
- Does it collapse?
- Does it poison the soil?
- Does it consume too much water?
- Does it destabilize oxygen/CO₂?
- Does it help another species survive?
- Can it be contained or reversed?

The workbench renders a small ecosystem — soil chemistry,
atmosphere, temperature, water cycle, native organisms (if any) —
and lets the player drop in candidate organisms (designed in
Stage 2) and observe outcomes over simulated time. The simulator
should run faster than real time, but slowly enough that the
player sees the dynamics, not just the final state.

Teaches: ecological consequence. Systems thinking at its highest
form in the game. Stewardship — not just "can I do this" but
"should I."

**Engineered-organism consequence model** (deferred — see
Section 6): whether failures in Stage 3 propagate to the live game
world (an organism escapes simulation and damages the player's
habitat) is a Real Game Mechanic decision that should be made
deliberately, not as a side effect of implementation.

### Discipline for the biology workbench

- Single workbench, three modes. Not three workbenches.
- Mode unlock is narrative/quest-gated, not branch-selected. The
  player progresses; they don't choose.
- Living-system parameters live in data. New organisms, new soils,
  new alien biomes are data additions, not code changes.
- Every mode supports observable failure. Failures must be
  diagnosable, not just "you lose."
- Ethics is gameplay, not lecture. Stage 3 should *demonstrate*
  consequences, not explain them in dialogue.
- The workbench is **portable** — when the player travels to space
  and to the alien planet, they take the workbench with them. This
  is a system the player owns, not a location they visit. Design
  the data model so "where this lives" is a runtime question, not
  a hardcoded scene reference.

### Foraging / Inventory System

Today: collect plants, minerals, parts, useful materials.

Scales to: regional resource gathering, scientific sampling, trade
goods, space mission payload, alien sample analysis.

Discipline: inventory distinguishes raw materials, tested
materials, crafted parts, biological samples, knowledge unlocks.
These are distinct types with distinct interactions.

### Quest Engine

Today: organizes learning into goals. Supports local quests, multi-
step engineering quests, region unlock quests, NPC trust quests,
act-level milestones.

Scales to: spacecraft module completion, terraforming milestones,
multi-region cooperation chains.

Discipline: quests refer to systems and data, not hard-coded scene
interactions. Observation gating must be implemented and respected
(currently broken — pending fix per
`.claude/bugs/2026-04-27-quest-engine-and-traversal.md`).

### Layout Editor

Developer-facing, not player-facing. Helps improve scenes visually
while preserving the Claude → Phaser → Claude workflow.

Discipline: the editor creates structured data. Opaque visual
edits that cannot be represented as data are forbidden.

### Audio / Character Speech System

Supports TTS-style character speech for accessibility, language
learning, and younger players.

Scales to: NPC spoken dialogue, bilingual lines, vocabulary
reinforcement, character personality, audio cues in puzzles, alien
sound design.

Discipline: spoken lines are generated from dialogue data, not
embedded in scene code. Per-language voice routing is configured
in `audioLanguageSystem.js`.

### Portability Principle

Carry-forward systems should be designed as **player-owned tools
that scenes host**, not as scene-attached content. The construction
system, the materials lab, the thermal rig, the chemistry lab, the
biology workbench, and the foraging/inventory system all eventually
travel with the player to space and to the alien planet.

This means: scene code mounts a system, but the system's state and
behavior do not depend on which scene mounted it. A bridge built
in Act 1 and a habitat built in Act 3 use the same construction
system. A material test on Earth copper and a material test on
alien obsidian use the same UTM rig.

Implementation discipline: separate system-state (what the player
owns) from scene-attachment (where they currently are). When a
proposed feature couples a system tightly to a specific scene, that
feature should halt-and-surface rather than ship.

---

## 5. Language & Geography Layer

Language and geography are gameplay systems, not flavor.

The world begins in Arizona, expands into other Earth regions,
and eventually leaves Earth. Each region has a biome, a resource
identity, a cultural identity, a language layer, and an
engineering reason to visit.

Regions are unlocked through a combination of:

- Quest completion
- Engineering readiness
- NPC trust
- Language/cultural access
- Transportation upgrades
- Map discovery

### Language as gameplay

- NPCs trust the player more when they learn greetings and
  respectful phrases.
- Shops offer better prices or rare items after language/culture
  quests.
- Technical recipes may require region-specific terms.
- Songs, stories, signs, diagrams, labels, and oral explanations
  are learning surfaces.
- Language learning is integrated into gameplay, not separated
  into flashcards.

### The committed seven-region/six-language coupling

Per `data/regions.js` and `data/languages.js`:

1. **Sonoran Desert / Arizona** — desert biome — English, Spanish,
   Arabic. First non-English exposure is Arabic, introduced through
   a family or mentor character with Levantine flavoring. Spanish
   is naturally present in NPC speech. Concepts: desert ecology,
   copper, silica, bike repair, bridge construction, heat survival.

2. **Mexico & Andes** — highland biome — Quechua + Spanish.
   Concepts: silver, lithium brine, obsidian, high-altitude ecology,
   mountain agriculture, pre-Columbian engineering traditions
   (handled per the cultural representation rule in Section 2).

3. **Arabian Region** — desert biome — Arabic (Levantine + Classical).
   Concepts: gold, rock salt, phosphate, frankincense resin, oasis
   ecology, classical chemistry/alchemy heritage, navigation traditions.

4. **Anatolian Plateau** — steppe biome — Turkish. Concepts: iron,
   copper, boron, marble, steppe ecology, classical metallurgy.

5. **Zagros / Iranian Plateau** — mountain steppe biome — Kurdish +
   Persian. Concepts: copper, zinc, lead, turquoise, lapis lazuli,
   highland ecology, gemstone chemistry.

6. **East African Savanna / Swahili Coast** — savanna biome —
   Swahili. Concepts: iron, gold, tanzanite, garnet, savanna
   ecology, coastal trade traditions, ironworking heritage.

7. **Yunnan / Xishuangbanna** — subtropical highland biome —
   Mandarin. Concepts: iron, tungsten, rare earths, jade, coal,
   subtropical ecology, traditional medicine, complex highland
   geography.

(Regions 1–7 are committed. `data/regions.js` lists Pakistan and
Malay Archipelago as future expansion possibilities; these are
canon-eligible but require human-authored cultural content before
inclusion in committed gameplay.)

### Act 3 language decision (pending)

Two coherent options:

- **Option A — Alien Semiotics:** the alien planet has its own
  symbolic/environmental language. The player decodes patterns in
  light, chemistry, terrain, microbial growth, or AI signals. Fits
  the "language as system" theme. More ambitious. Requires the
  audio/dialogue/language systems to support non-text symbolic
  communication.

- **Option B — Human Multilingual Continuity:** the alien planet is
  explored by a multilingual human/AI crew, and Earth languages
  continue to matter for teamwork, memory, culture, and mission
  logs. Simpler. The existing language system carries forward
  unchanged.

This decision affects how the language and dialogue systems are
architected *now*, not in Act 3. Flagged as a high-priority
decision in Section 6.

---

## 6. Open Design Questions

These are not blockers. They are honest unknowns that should guide
future design sessions. Bigger this section, more honest the
document.

### Architectural / High Priority

- **Act 3 language decision** (Option A vs B). Affects language
  system architecture *now*, not later.
- **Biology workbench Stage 2 unlock trigger.** Quest-gated?
  Act-gated? Skill-demonstration? Affects whether Stage 1 design
  needs to anticipate Stage 2 surfacing.
- **Engineered-organism consequence model.** If consequences
  propagate beyond the simulator (escape, displacement, ecosystem
  damage), this needs simulation-tick architecture in the engine.
  Decision deferred but should be made before Stage 3 design.
- **Portability mechanism for carry-forward systems.** Is "take
  the workbench with you" a literal inventory item? A permanent
  unlock? Part of the ship? Affects how every carry-forward system
  is architected from Act 1 onward.

### Act Structure

- Is Act 2 fully global, or mostly Arizona plus selected resource
  expeditions?
- Does the player physically travel to each region, or access some
  through map/mission nodes?
- Is the spacecraft built in one central garage/hangar, or
  assembled across multiple regions?
- Is the spacecraft a single megaquest or a modular questline?
- Does Act 3 involve one alien planet, multiple planets, or one
  planet with multiple biomes?
- Is Act 3 mostly quest-driven, sandbox, or hybrid?
- **Act-to-act transition mechanics:** narrative cutscene? Natural
  expansion? Mentor-told? "Act 2" screen?

### Biology Workbench

- Does biology start in Act 1 with plants/medicine, Act 2 with
  greenhouse/life support, or both?
- How much genetic engineering is appropriate for the target age?
- Do engineered organisms have consequences immediately, or only
  in Act 3?
- Can the player accidentally damage an ecosystem? If yes, is the
  consequence reversible?
- How to teach ethics without becoming preachy?

### Material Science

- How detailed should material properties be?
- Should UTM testing show real stress-strain curves or simplified
  visual bars?
- Should fatigue testing be introduced?
- Should corrosion be a property?
- Should cost/availability matter?
- Should materials have cultural/trade value separate from
  engineering value?
- How are alien materials tested without overwhelming the player?

### Bridge / Construction

- Is the bridge scene a one-time tutorial or recurring design
  pattern?
- Should the player manually place beams and supports?
- Should the bridge fail visibly if poorly designed?
- Should the system validate using simplified physics or rule-
  based checks?
- Should different biomes require different bridge logic — heat,
  ice, wind, corrosion, low gravity?

### Geography

- How does fog-of-war/discovery work on the global map?
- Does each region require language proficiency to enter?
- How does the player physically reach distant regions —
  spacecraft? Existing transit?

### Language

- How much vocabulary is enough to unlock a region?
- Is language mastery required or optional?
- Does pronunciation matter if speech recognition is not available?
- Does TTS speak each language?
- Are translations always visible, or unlocked gradually?
- Does Arabic remain the primary first non-English exposure, or
  should the order vary by player choice?

### Spacecraft

- What type of spacecraft: rocket, spaceplane, modular capsule, or
  fictional educational craft?
- How realistic should propulsion be?
- Are fuels included, or abstracted?
- Does the player test each module?
- Does failure cause rebuild loops or narrative feedback?
- Does the bike influence spacecraft design thematically,
  mechanically, or visually?

### Educational Weird-Zones

These topics fit the design philosophy but are not yet integrated:

- **Möbius cave:** topology, orientation, non-intuitive geometry.
- **Non-Newtonian zone:** viscosity, shear-thickening fluids,
  strange movement.
- **Invisible map / discovery fog:** observation, mapping,
  inference.
- **Sound/frequency mechanics:** resonance, waveforms,
  communication.
- **GPS map without terrain:** terrain-aware mapping as a design
  requirement.
- **Civilizations-style discovery:** are unexplored regions
  visually hidden, blurred, or symbolically unknown?

**Rule:** use the UTM approach for all of these. Do not add the
topic as trivia. Turn it into a tool, puzzle, test rig, or
environmental mechanic that solves a real gameplay problem. If a
proposed weird-zone cannot be expressed as such a mechanic, it
shouldn't ship.

---

## 7. Out of Scope

These are intentionally out of scope unless explicitly re-opened.

- Cross-pillar feature work between the game and the
  Discovery/Building/Safe-Search pillars without explicit
  human-authored design briefs (see Context section).
- Multiplayer or online co-op.
- Combat as a primary mechanic.
- Boss fights as the main progression model.
- Microtransactions.
- Gambling mechanics.
- Real-time twitch difficulty as the main challenge.
- Fully realistic orbital mechanics.
- Fully realistic genetic engineering simulation.
- Procedural generation as the primary world-building method.
- Adult grimdark survival tone.
- Extractive colonial "conquer the planet" framing.
- Language as isolated flashcards only.
- One-off educational minigames that do not connect to the core
  systems.
- Scene-specific hacks that prevent Claude ↔ Phaser ↔ Claude
  iteration.
- Opaque visual edits that cannot be represented as structured
  data.
- Cultural content (indigenous, religious, marginalized) generated
  without a human-authored design brief.

---

## Document History

- v1.0 — 2026-04-27 — initial draft
- v1.1 — 2026-04-27 — committed regions/languages reconciled with
  shipped data; biology workbench section expanded using UTM
  pattern; cultural representation rule promoted; architectural
  discipline subsection added; meta sections (How to Use, Document
  History) added.
- v1.2 — 2026-04-27 — BikeBrowser+ four-pillar Context section
  added at top; cross-pillar opportunities documented as out-of-
  scope-for-now; portability principle added to carry-forward
  systems with workbench portability noted explicitly; portability
  mechanism added to high-priority open questions; cross-pillar
  scope rule added to Section 7.
