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

The **mechanical spine** that carries this scaling is a seven-rung
vehicle progression — **bike → e-bike → motorcycle → car → boat →
plane → spacecraft** — where every rung the player repairs and then
builds. Each rung introduces exactly one new engineering domain on
top of the previous one (mechanical → electrical → combustion →
systems-integration → fluid dynamics → aerodynamics → vacuum & life
support) and the vehicle is also the literal key that gates how far
the player can travel. The full spine is defined in Section 3.

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

**Biology is the living equivalent of the Materials Lab.** Where the
Materials Lab asks *"what are objects made of?"*, biology asks *"what
are living systems made of, and why do they behave as they do?"*. All
biological systems follow a canonical educational loop that parallels
the UTM pattern: **Observe → Test → Model → Predict → Engineer.** The
player never memorizes biological facts; they discover relationships,
and they succeed by understanding a system deeply enough to **predict
its outcome before it happens**. The full biological progression is in
Section 3 (Biological Progression Spine).

**Canon rule — relationships, not facts.** The game never teaches
facts; it teaches relationships. This applies equally to engineering,
ecology, ethnobotany, chemistry, phytochemistry, pharmacology,
cellular biology, molecular biology, microbiology, systems biology,
life support, and terraforming. A feature that reduces a domain to
trivia, a quiz, or an encyclopedia-completion meta is the anti-pattern
and should halt-and-surface.

**Educational Hierarchy (permanent ARC rule).** Every quest, system, and
curriculum element maps to one of five rising levels: (1) **Observe** —
notice and record; (2) **Explain** — say *why*; (3) **Predict** — say
what *will* happen before it does; (4) **Engineer** — change the system
to a chosen outcome; (5) **Teach** — explain it to someone else well
enough that they can predict it. The player is almost never asked *"what
is the answer?"*; they are asked *"what will happen?"* and eventually
*"can you teach someone else why?"*. The hierarchy overlays the three
acts as rising cognitive demand: Act 1 is dominated by **Observe**, Act 2
by **Explain**, Act 3 by **Predict → Engineer** — while every act still
contains all five levels.

**Prediction precedes intervention (canon rule).** *The player may not
modify a system until they can accurately predict it.* This applies
uniformly — bridges, engines, aircraft, spacecraft, ecosystems, cells,
organisms, and genetic systems. It is the unifying discipline behind
"test before you trust" (engineering), "simulation before deployment"
(ecology/terraforming, §3), and the staged Biological Engineering
progression (§3, §4). A feature that lets the player intervene in a
system they have not first learned to predict is a halt-and-surface
trigger.

**Academic-standards posture (canon).** **Arizona Academic Standards are
the minimum mastery baseline**; advanced frameworks (Massachusetts
Science, California Mathematics Framework, Virginia STEM, Singapore Math)
are **enrichment**; gifted frameworks (Beast Academy, Art of Problem
Solving, Mensa-for-Kids enrichment concepts) are **optional depth**. **No
enrichment or gifted content may ever be required for progression.**
Standards and reasoning tagging live in `reasoning-substrate.md`; the
game never shows school-style questions — it tags quests with reasoning
domains and hierarchy levels instead.

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

### Mechanical Progression Spine — Seven Vehicle Chapters

The game's mechanical/engineering progression is a **seven-rung
vehicle ladder**. The player **repairs and then builds** each
vehicle in turn. This spine is the backbone the three acts are
organized over: each rung adds exactly one new engineering domain
on top of everything before it, exercises a new UTM-style test rig
(per Section 2 and Section 4), and acts as the literal
transportation key that gates map reach (per Section 5). Geography,
culture, and language (Section 5) are the **supply chain** that
feeds each vehicle — they answer *where* materials and knowledge
come from; the vehicle answers *what* the player can build and *how
far* they can go.

| Ch | Vehicle | New engineering domain (added to all prior) | New UTM-style rig | Reach it unlocks |
|---|---|---|---|---|
| 1 | **Bike** | Pure mechanics: structure, gears, chain, brakes, torque, friction | UTM (tension/compression) | Neighborhood / local desert |
| 2 | **E-bike** | Electrical: battery, motor, controller, circuits, charging, regen braking, energy storage | Circuit + battery rig | Extended local range |
| 3 | **Motorcycle** | Combustion powertrain: engine, fuel, ignition, transmission, cooling, exhaust | Engine / thermal dyno | First regional roads |
| 4 | **Car** | Systems integration & scale: chassis, drivetrain, steering geometry, safety/crash, HVAC, load distribution | Crash / load + systems test | Overland cross-country (connected land regions) |
| 5 | **Boat** | Fluid dynamics & buoyancy: hull, displacement, hydrodynamics, marine propulsion, salt corrosion, ballast/stability | Buoyancy / hydro tank | Ocean & coastal regions |
| 6 | **Plane** | Aerodynamics & flight: lift/drag/thrust/weight, airfoils, control surfaces, strength-to-weight, fatigue, pressurization | Wind tunnel | Intercontinental / isolated highlands |
| 7 | **Spacecraft** | Vacuum & extremes: reaction propulsion, re-entry/cryo thermal, life support (→ biology workbench), redundancy, materials certification | Vacuum / re-entry chamber | Leave Earth → alien planet |

A strength-to-weight / safety-factor thread runs through every rung:
the bike teaches "is this beam strong enough?"; the plane and
spacecraft teach "is it strong enough *and* light enough *and*
redundant enough?". Nothing is discarded between rungs — the UTM,
construction, thermal, chemistry, electrical, fluid, and aero rigs
are all **portable carry-forward systems** (Section 4) the player
owns and re-uses on every later vehicle.

**Act grouping by medium.** The seven chapters are grouped into the
three acts by the medium the vehicle operates in:

- **Act 1 — Ground** — Chapters 1–4 (bike, e-bike, motorcycle, car).
  Begins in the Sonoran Desert (Chapter 1, the shipped foundation)
  and expands overland across connected Earth land regions as the
  ground vehicle improves.
- **Act 2 — Sea & Air** — Chapters 5–6 (boat, plane). Unlocks the
  ocean/coastal and intercontinental regions that ground vehicles
  cannot reach; spacecraft subsystem groundwork begins here.
- **Act 3 — Space** — Chapter 7 (spacecraft) plus terraforming and
  life-engineering on the alien planet.

**Reconciliation with the Act prose below (and with prior versions).**
The detailed Act 1/2/3 descriptions that follow remain canon for
their **setting, curriculum, geography, language, and carry-forward
content** — they are now read as layers over this vehicle spine
rather than as the primary axis. Two specific reconciliations:

1. The earlier "Act 1 = Sonoran Desert only" framing widens: Act 1
   (Ground) starts in the Sonoran Desert and grows overland through
   Chapters 2–4. The Sonoran/bike content below is **Chapter 1**.
2. The earlier "build the spacecraft in Act 2" framing is
   superseded: spacecraft assembly now spans the upper chapters and
   completes in Act 3 (Chapter 7). The Act 2 prose below — its
   per-region resources, the seven committed regions, the modular
   subsystem list, and the language/culture gating — remains canon
   as the **supply-chain layer feeding every vehicle chapter**,
   especially the car, boat, plane, and spacecraft.

Discipline: each new rig (electrical bench, fluid/buoyancy rig,
aerodynamics rig) is a carry-forward system subject to the Section 4
discipline and the Section 8 world-model rules — portable,
data-driven, primitive-declaring, with no per-vehicle scene hacks.
A vehicle chapter that hard-codes its tooling into one scene, or
that adds a "for this vehicle only" branch inside a portable system,
is a halt-and-surface trigger (§8.2).

### Biological Progression Spine — Seven Biological Domains

Running **parallel** to the mechanical/vehicle spine is a biological
curriculum spine. The two ladders reinforce each other and neither
replaces the other: the vehicle answers *what the player can build and
how far they can go*; the biological spine answers *what living systems
are made of and how they behave*. Biology is the living equivalent of
the Materials Lab (Section 2), and every domain on this spine follows
the canonical loop **Observe → Test → Model → Predict → Engineer**.

| Ch | Vehicle | Biological domain | The question the player learns to answer |
|---|---|---|---|
| 1 | Bike | **Ecology** | Why does this organism survive here and fail elsewhere? |
| 2 | E-bike | **Ethnobotany** | How do humans turn a plant into food, fiber, dye, medicine, fuel? |
| 3 | Motorcycle | **Phytochemistry** | What molecules are inside a plant, and why does extraction method change the outcome? |
| 4 | Car | **Cellular Biology** | What are living systems made of at the cell scale, and why does this soil/tissue support life? |
| 5 | Boat | **Microbiology** | Why does fermentation work, and how do microbes change ecosystems? |
| 6 | Plane | **Molecular Biology** | What mechanism (DNA / RNA / protein / enzyme) explains this observation? |
| 7 | Spacecraft | **Systems Biology & Life Engineering** | What happens to the whole system if I change one part — and should I? |

The biological spine is **cumulative**, exactly like the vehicle spine:
ecology is never discarded when phytochemistry arrives; molecular
biology explains *why* the ethnobotanical remedy from Chapter 2 works.
The instruments that serve these domains (Extraction Bench, Microscope,
Growth Chamber, Fermentation Bench, Pharmacology Bench, Ecosystem
Simulator) are portable carry-forward systems defined in Section 4, and
the Biology Workbench remains the single central biological instrument
the player owns and carries across every act (no separate biology
minigames).

#### The Unified Biological Knowledge Graph

These domains are **not** disconnected subjects — they are **facets of
one shared entity**. Every biological object in the game participates in
a single knowledge graph:

```
Species → Ecology → Culture → Uses → Chemistry → Pharmacology
        → Cellular Biology → Molecular Biology → Systems Biology → Gameplay
```

The same `speciesId` carries all facets; each substrate (ecology,
ethnobotany, phytochemistry, pharmacology, biology workbench) is a
**lens** on the shared entity, never a parallel copy (single-authority
discipline, §8.6). Worked example:

> **Willow**
> - **Ecology:** riparian species (lives at water's edge).
> - **Culture:** traditional pain remedy (gated cultural content, §2).
> - **Chemistry:** contains salicin.
> - **Pharmacology:** modulates an inflammatory pathway (mechanism, not
>   prescription).
> - **Cellular:** acts on cell signaling.
> - **Molecular:** the cyclooxygenase pathway.
> - **Systems:** a stress-response effect.
> - **Gameplay:** *"Investigate why willow tea reduces pain"* — the
>   player follows the chain from observation to mechanism, and never
>   "takes" or "prescribes" anything.

A player can enter this graph at any facet (find the plant, observe the
cell, extract the molecule) and the game rewards connecting facets —
that connection *is* the learning.

#### Universal Dose-Response Principle (canonical cross-cutting theme)

Dose-response is one of the game's universal scientific themes, not a
medicine-only idea. **Small changes may help; moderate changes may
optimize; large changes may cause harm.** The same curve appears across
medicines, nutrients, fertilizers, water, heat, sunlight, oxygen,
pollutants, and ecosystem interventions — and across engineering,
chemistry, biology, and terraforming. Any system that introduces a
quantity the player can increase should expose its dose-response
behavior (visible benefit, optimum, and overshoot-harm), never a
monotonic "more is better."

#### Simulation before deployment (canonical rule, reaffirmed)

No organism, ecosystem intervention, or engineered biology is released
into the live world without being run in the Ecosystem Simulator first
(Section 4; arc.md §3 Act 3). This is a non-negotiable rule, not a
late-game convenience.

#### Act 3 capstone — Biological Engineering (genetic engineering, reframed)

Genetic engineering is included — but **reframed as Biological
Engineering & Synthetic Biology**, because a "gene-editing minigame"
would violate canon already established (simulation before deployment,
systems thinking, ecology first, stewardship over extraction, no magic
technology jumps). The player does **not** start by editing genes; they
start by understanding systems. Biological Engineering is the
**culmination** of the entire spine:

> Observe a plant → understand the plant → understand the cell →
> understand the molecule → understand the ecosystem → predict
> consequences → engineer responsibly.

It is **not** three new vehicle chapters. It is the Act-3 / Chapter-7
deepening of the biological spine, gated by the **prediction-precedes-
intervention** rule (§2). The biological ladder, fully extended:

```
Ecology → Ethnobotany → Phytochemistry → Pharmacology → Cellular Biology
       → Molecular Biology → Systems Biology
       → Synthetic Biology → Biological Engineering → Terraforming Ecology
```

**Biological Engineering progression (Act 3, gated by prediction).** Five
stages, lowest-risk first — each is an *engineering mode* of the one
Biology Workbench, detailed in `biology-substrate.md`:

1. **Selective Breeding** — lowest-risk introduction. Combine parent
   traits (drought tolerance, cold tolerance, food yield). Question:
   *which parent traits should be combined?*
2. **Microbial Engineering** — manipulate fermentation communities,
   nutrient cycles, decomposition (soil microbes, nitrogen fixers,
   compost). The focus stays on **ecosystems**, not individual genes.
3. **Synthetic Biology** — in **simulation only**. What traits are
   needed (oxygen production, salt/drought tolerance, nutrient
   efficiency)? What tradeoffs and unintended effects emerge?
4. **Life Support Engineering** — design closed ecological loops (food,
   oxygen, water recycling, waste recycling) for spacecraft and habitats.
5. **Terraforming Biology** — capstone. *Can this ecosystem remain
   stable?* Success requires **biodiversity, resilience, reversibility,
   and containment** — never maximum growth.

**New educational domains introduced here:** Genetics (inheritance,
mutation, selection, recombination), Genomics (genes, regulation,
expression), Synthetic Biology (biological circuits, engineered traits,
system constraints), and Evolutionary Biology (adaptation, fitness,
drift, selection).

**Critical safety rule (canon).** *Biological Engineering is not a power
fantasy.* Every intervention has benefits, costs, and unintended
consequences. The player is rewarded for **stewardship, not domination**.
Nothing enters the live world directly — every engineered organism passes
through **Simulation → Containment → Small-scale testing → Ecosystem
review → Release** (the Genome/Population/Trait/Ecosystem simulators,
§4). A feature that ships an engineered organism into the world without
that chain halts-and-surfaces.

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
interaction layer, and — unlocked **after the bridge repair** — the
**Skate Park** (the first large modifiable destination and construction
sandbox; BMX → scooter → skateboard; see §4 *Skate Park System*).

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

### Skate Park System

Today: not yet built. **Planned canon** (additive). Unlocks after the
Act 1 / Chapter 1 bridge repair — repairing the bridge reconnects the
neighborhood, and the Skate Park becomes accessible as the first large
neighborhood *destination* the player can ride and reshape. It arrives
partially damaged, incomplete, with limited obstacles, and grows with
the player.

Scales to: BMX parks, motorcycle tracks, vehicle ramps, boat launches,
aircraft runways, spacecraft launch infrastructure, obstacle courses,
and vehicle testing grounds — the same modular-construction + applied-
physics pattern at larger scale.

Purpose: the player learns physics **by riding**, not by lecture —
momentum, velocity, gravity, friction, center of mass, balance, and
trajectory through play; structural engineering and materials science
through building the obstacles they ride. It is the player's first
large-scale *modifiable* environment and their first construction
sandbox — the bridge was a guided build; the park is open design.

**Modular, data-driven park.** Every obstacle is an object — quarter
pipe, half pipe, launch ramp, fun box, rail, grind box, manual pad,
bowl section, stair set, spine ramp, wall ride, pump-track segment. No
hardcoded layouts. Park layouts are data and live in `public/layouts/`
alongside every other scene layout (the same data-first architecture
used elsewhere in this document).

**Construction loop.** The player may place, move, rotate, remove,
save, and load obstacles — the same construction philosophy as the
bridge and every other carry-forward system. Each obstacle exposes the
physics parameters that drive gameplay: height, angle, radius, surface
type, friction, and material. These are the same fields the Materials
Lab and Construction System already speak, so a ramp's material behaves
under the same schema as a bridge member — the carry-forward contract.

**Human-powered core; vehicles introduced in order.** BMX is the
primary vehicle (introduced first), then Scooter (after BMX basics),
then Skateboard (after the neighborhood expansion). An e-bike stunt
area and a motorcycle stunt-training area are *future, separate
sections*; the core park stays human-powered.

**Five-level progression** (community + engineering, not just bigger
ramps):
1. Basic neighborhood park — small ramps, simple rails, beginner lines.
2. Expanded park — larger transitions, bowls, advanced rails.
3. Community-funded upgrades — NPCs contribute materials; the player
   helps design expansions.
4. Engineering park — the player constructs custom obstacles and meets
   structural limits.
5. Regional showcase park — can host challenges and competitions.

**Reasoning quests** (the park is a reasoning lab): prediction (which
ramp produces the longest jump?), optimization (complete a line using
only three obstacles), experimental design (what changes if the launch
angle changes?), and systems thinking (how does placement affect rider
flow?).

**Community layer.** NPCs use the park; the player teaches tricks,
hosts events, completes repair/safety quests, and redesigns sections —
a living neighborhood hub, not a side minigame.

**Educational hierarchy made visible.** The park is one of the first
places all five levels appear together: Observe (watch riders) →
Explain (why a trick works) → Predict (estimate the landing) →
Engineer (build a better obstacle) → Teach (help another rider clear a
challenge).

Discipline: the park is a **carry-forward construction + applied-
physics system, not scene-attached content** (per the Portability
Principle). Obstacles, their physics fields, and saved layouts are
data; scene code hosts the park but does not own its state. The layout
format must be generic enough to later power BMX parks, motorcycle
tracks, obstacle courses, and vehicle testing grounds without a
separate architecture. Future expansion: player-created, downloadable,
challenge, and educational-physics-scenario layouts — all the same
layout system.

**Scope note (status):** unlocks at the end of Act 1 / Chapter 1.
*Implementation status (2026-06-21):* **Phases 2–3 shipped** — the obstacle
data model (`skateparkObstacles.js`), the data-driven Level-1 layout
(`public/layouts/skatepark.level1.json`), the `SkateParkSystem`, the
post-bridge unlock, the side-view BMX riding scene (`SkateScene.js`:
ride/jump/ramp-launch/safe-bail) with the **Physics Goggles** (velocity
vector + predicted trajectory + landing marker), AND the **flow system +
3 reasoning quests** (predict/optimize/experiment, Observe→Predict→Test→
Explain) with extended park metrics are built and validated in the live
game. Next: community NPC sim + visual evolution (human-gated art) + the
player build/save editor (Phase 5). Built gated behind the
unlock so the frozen Act-1 critical path is unaffected. See
`artifacts/bikebrowser/skatepark_{audit,visual_bible,architecture,implementation_report}.md`.

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

### Electrical Bench

Introduced with the **e-bike** (Chapter 2). Today (target): wire a
battery → controller → motor circuit, see current flow, manage
charge, observe failure (short, over-discharge, overheating motor).

Scales to: motorcycle ignition/starter electrics, car wiring
harness and sensors, boat/plane avionics, spacecraft power bus and
guidance electronics. Shares the battery-chemistry boundary with
the Chemistry Lab (cells are a chemistry recipe; the pack is an
electrical system).

Discipline: components and their properties (voltage, capacity,
resistance, thermal limits) live in data; the bench is one portable
system, not a per-vehicle minigame. Heat from electrical load is a
Thermal Rig interaction, not a re-implementation.

### Fluid / Buoyancy Rig

Introduced with the **boat** (Chapter 5). Today (target): test hull
shapes for displacement, buoyancy, and drag in water; balance
ballast for stability; observe failure (capsize, swamping,
cavitation, salt corrosion over time).

Scales to: water channels and irrigation (back-compatible with Act
1 desert washes), marine propulsion, plane control of a fluid
(air is a fluid — the rig generalizes toward the Aerodynamics Rig),
alien-planet liquid handling and terraforming water cycles.

Discipline: fluid is a general medium-interaction system (density,
viscosity, drag, buoyancy), not a one-off boat hazard. Terrain and
water availability are consulted via world-model primitives (§8.4),
not hard-coded per scene.

### Aerodynamics Rig

Introduced with the **plane** (Chapter 6). Today (target): a simple
wind tunnel — test airfoils and bodies for lift vs drag, place
control surfaces, trade strength for weight, observe failure (stall,
flutter, structural overload, loss of control).

Scales to: spacecraft re-entry aerodynamics and control, parachute/
landing systems, alien-atmosphere flight (different density/gravity
changes the same equations). Shares the strength-to-weight and
fatigue concerns with the Materials Lab / UTM rig.

Discipline: the four-forces model (lift, drag, thrust, weight) lives
in data and a shared solver; do not fork a separate physics model
per vehicle. Atmosphere density is an environmental primitive, so
the same rig works on Earth and on the alien planet (§8.2 — no
act-specific carve-outs).

### Biology Workbench

Not yet built. Will become one of the most important systems.
**Designed using the UTM pattern: a real scientific instrument
(or rather, a progression of instruments) simplified into a
visually understandable game mechanic that the child uses to
solve actual problems.**

**Design document:** see
`src/renderer/game/systems/biology/biology-substrate.md` for the full
three-stage data model, public API, event model, ecology-bridge
contract, and open questions (Stage 2 unlock trigger, engineered-
organism consequence model, Stage 3 tick rate, etc.). Paired with the
ecology substrate above; the two share a Species concept.

Detailed system specification: see
`src/renderer/game/systems/biology/biology-substrate.md`.

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

### Biology Workbench — observation-scale modes and instruments

The Biology Workbench (above) progresses along **two orthogonal axes**,
and both are canon:

- **Interaction mode** (existing canon, `biology-substrate.md`):
  **Recipe → Parametric → Simulation** — how much the player controls
  and simulates (place known inputs → expose the dials → run an
  ecosystem in silico).
- **Observation scale** (this addition): **organism → cell → molecule →
  system** — how deeply the player zooms. The seven-domain Biological
  Progression Spine (§3) is this scale axis. The two axes compose: a
  player working at *cell scale in Parametric mode* tunes a growth
  chamber on a microbial culture; at *molecule scale in Simulation mode*
  they model a pathway before acting.

It remains **one workbench** the player owns and carries (Portability
Principle); the scale modes unlock narratively, the player does not pick
a branch. The following instruments are the scale axis made playable —
each is a portable carry-forward system following the UTM pattern and
the §8 world-model rules (data-driven, primitive-declaring, no
per-scene/per-vehicle hacks):

- **Extraction Bench** (after the Chemistry Lab; serves Phytochemistry,
  Ch3+) — water / alcohol / oil / resin extraction and distillation, so
  the player learns why method changes the compound recovered. The
  molecule-scale entry point.
- **Microscope** (Cellular Biology, Ch4) — observe structures (cells,
  nuclei, membranes, chloroplasts, mitochondria). The biological
  analog of Materials inspection.
- **Growth Chamber** (Cellular/Micro, Ch4–5) — control temperature,
  nutrients, light, water; the biological analog of the Thermal Rig,
  and the home of dose-response for living systems.
- **Fermentation Bench** (Microbiology, Ch5) — observe microbial
  systems and how they change an environment; the biological analog of
  the Chemistry Lab.
- **Pharmacology Bench** (Pharmacology, Ch3+) — observe what biological
  molecules *do* (dose-response, potency, toxicity, adaptation,
  resistance, receptor signaling, metabolism) as **mechanism**, never
  prescription. The biological analog of systems testing.
- **Ecosystem Simulator** (Systems Biology, Ch7, capstone) — predict
  whole-system outcomes before deployment (introduce a species, change a
  nutrient, remove a pollinator, raise temperature → feedback loops,
  resilience, collapse, succession, carrying capacity, network effects).
  The biological analog of spacecraft simulation; the enforcement point
  of the "simulation before deployment" rule.

**Biological-Engineering instruments (Act 3; unlocked after Molecular
Biology; gated by prediction-precedes-intervention, §2):**

- **Genetics Workbench** — visualize information flow **DNA → RNA →
  Protein → Trait**. The player learns *how* a trait arises, not how to
  "edit" one; this is the comprehension gate before any engineering.
- **Trait Simulator** — explore **Trait A + Trait B = Outcome C**
  *before* any modification (selective-breeding and synthetic-biology
  reasoning). Tradeoffs must be visible.
- **Population Simulator** — observe evolution, selection, and
  adaptation across generations (Evolutionary Biology domain).
- **Genome Simulator** — late-game; test engineering ideas **safely, in
  silico**. No organism enters the game world from here directly —
  everything passes through Simulation → Containment → Small-scale
  testing → Ecosystem review → Release (§3 capstone rule).

Discipline: these instruments are modes/peripherals of the one Biology
Workbench, not separate minigames. Living-system parameters, organisms,
compounds, cell/molecule/gene data live in data; new biomes and alien
organisms are data additions, not code. Every instrument supports
observable, diagnosable failure (arc.md §4 biology discipline).
Biological Engineering is not a power fantasy: prediction precedes
intervention, and stewardship is the rewarded outcome (§2, §3).

### Ecology Substrate (EcologyEntity)

Carry-forward system at `src/renderer/game/systems/ecology/`. Owns
living things in the world — plants, animals, microbes — as
scene-independent typed instances with species ids, observation hooks,
foraging hooks, and relational tags sourced from `data/ecology.js`
(canonical: PLANT_ECOLOGY, PREDATOR_CHAINS, BIOMES, TIME_BEHAVIOR).
Per the Portability Principle below: scenes mount EcologyEntity at a
mount point, but the entity's state (and the procedural population
layer in Phase 6) is owned by save, not by scene.

Today: `data/ecology.js` defines plant↔animal relationships; the legacy
`populateWorld` in `ecologyEngine.js` consumes them in NeighborhoodScene
only. The substrate ports this into a portable carry-forward system per
the audit at
`.claude/bugs/2026-04-27-ecology-substrate-vs-static-layout-audit.md`
(Path B selected).

Scales to: Act 1 desert ecology (food-chain discovery, predator/prey
observation), Act 2 regional ecology (extraction-has-consequences,
seven Earth regions, depletion dynamics), Act 3 closed-loop ecology
(Stage-3 simulation biology consumes EcologyEntity as its progenitor;
alien species register through the same FLORA/FAUNA/PLANT_ECOLOGY
pattern with no act-specific carve-outs per §8.2).

Discipline: ecology relationships live in data, not hard-coded per
scene. Species registration is data-additive, not code-additive. No
scene imports inside the system module. No biome-string fragmentation
per §8.6 — use `getBiomeAt()`. Visual tokens come from data so the
licensed-asset import dispatch can swap tokens without code changes.

**Primitive declarations (per §8.1):**

- **Environmental primitives consulted:** biome (via `getBiomeAt()`),
  terrain (per §8.4), time-of-day (via `TIME_BEHAVIOR`).
- **Progression primitives updated:** observations (`state.observations`
  receives speciesId on observation); knowledge state when
  `knowledge-state-substrate.md` lands (deferred per §8.5; do not
  consume before).
- **Act 1 → Act 3 scaling:** Act 1 = single region; Act 2 = per-region
  ecology tables and depletion; Act 3 = same schema feeds Stage-3
  simulation biology.

See `src/renderer/game/systems/ecology/ecology-substrate.md` for the
full design document, public API, event model, save state, and open
questions. Paired with `src/renderer/game/systems/biology/biology-substrate.md`
in the same commit (the two systems share a Species concept and a
relational data model).

Detailed system specification: see
`src/renderer/game/systems/ecology/ecology-substrate.md`.

### Ethnobotany Substrate (PlantUseEntity)

Carry-forward system at `src/renderer/game/systems/ethnobotany/`. Owns
the relationship between a **plant, a culture, and a use** — the bridge
that turns the ecology substrate's *living things* into the chemistry
lab's *inputs*, the materials lab's *samples*, the construction
system's *parts*, the medicine/dose-response curriculum, and the
biology workbench's *recipes*. It is the canonical UTM expression for
plants (arc.md §2): **Observe → Harvest → Test → Process → Build**,
never plant-identification trivia. Shares the `speciesId` concept with
the Ecology Substrate (ecology owns the organism's existence;
ethnobotany owns what is done with it) and feeds the Knowledge State
System (ethnobotany is one of its richest domains).

Today: data backbone (`data/ethnobotany.js`) curated from open sources
in three tiers — Tier 1 (Native American Ethnobotany DB, USDA PLANTS,
Native Seeds/SEARCH) supports Act 1; Tier 2 (BHL, FAO, Open Context)
adds historical/agricultural depth; Tier 3 (PubChem, ChEBI, NIH herb
databases) links plant → molecule. Substrate not yet implemented.

Scales **along the seven-chapter vehicle spine (§3)** — the same plant
deepens as the player's engineering rises: Ch1 direct materials (yucca
fiber → bike-bag repair; mesquite → trail bread); Ch2 plants-as-chemistry
(dyes, tannins, oils, bio-adhesives → insulated battery pouch); Ch3
fuels/lubricants/resins/gums (pine resin, frankincense, mastic, acacia
gum → engine applications); Ch4 industrial materials (rubber, cellulose,
composites — "why are cars made from these?"); Ch5 marine ethnobotany
(canoe woods, rope plants, waterproofing — Swahili, dhow, Andean reed
boats); Ch6 strength-to-weight (bamboo, balsa, flax, hemp → lightweight
aircraft member); Ch7 closed-loop life support (which plants make
oxygen, fix nitrogen, tolerate salt, repair soil, provide medicine and
calories — feeding Stage-3 Simulation Biology and terraforming).

**Primitive declarations (per §8.1):**

- **Environmental primitives consulted:** biome (via `getBiomeAt()`),
  terrain (harvest viability, per §8.4), climate/season (harvest ethics).
- **Progression primitives updated:** observations (`state.observations`);
  inventory (typed: raw vs tested vs crafted vs biological sample);
  knowledge state when `knowledge-state-substrate.md` implementation
  ships (deferred per §8.5; reserved, not consumed today).
- **Act 1 → Act 3 scaling:** Act 1 = Sonoran backbone deepened across
  Ch1–4; Act 2 = per-region tables (marine + strength-to-weight species)
  under the §2 cultural-representation rule; Act 3 = same schema feeds
  Stage-3 closed-loop simulation. No act-specific carve-outs (§8.2).

**Cultural-content discipline (load-bearing — §2).** Ethnobotany touches
indigenous, religious, and marginalized cultural knowledge. Every
culturally-attributed entry (the `cultures.*` and `uses.ceremonial`
fields, and any region's traditional-use content) **requires a
human-authored design brief and sourced provenance** — no agent
generates such content. Registration refuses a cultural/ceremonial use
lacking human review; traditional-knowledge sourcing follows
Indigenous-data-governance norms (attribution, consent, CARE
principles) beyond the source license. Medicinal uses carry mandatory
dose-response + safety annotations; the game never instructs foraging-
and-eating or makes efficacy claims.

Detailed system specification: see
`src/renderer/game/systems/ethnobotany/ethnobotany-substrate.md`.

### Phytochemistry Substrate (CompoundUseEntity)

Carry-forward system at `src/renderer/game/systems/phytochemistry/`.
The bridge between **Ethnobotany ↔ Chemistry ↔ Pharmacology**: it owns
*what molecules are inside a plant and how processing changes them*.
Introduced with the **motorcycle** (Chapter 3, where plants become
fuels, lubricants, resins, and gums) and central from there on. Follows
the biology loop **Observe → Test → Model → Predict → Engineer** via the
Extraction Bench: the player learns by experiment why **boiling**
(water extraction) yields a different result than **alcohol** or **oil**
extraction, and meets compound families — **alkaloids, terpenes,
phenolics, flavonoids, resins, tannins, essential oils** — never as a
memorized list, always as the answer to a problem (a sealant, a dye, a
lubricant base, a remedy to investigate).

Today: data backbone links each plant use to compound references in
chemistry data (Tier-3 sources: PubChem, ChEBI, ChemSpider). Substrate
not yet implemented. Shares `speciesId` with ecology/ethnobotany and
`compoundId` with chemistry data — it stores the *link and the
extraction outcome*, not the molecule definition.

**Primitive declarations (§8.1):** consults biome/season (via the plant
record) for what is harvestable; updates observations and typed
inventory (raw extract vs purified compound vs tested compound);
reserves knowledge-state writes until that system ships (§8.5). Act 1→3
scaling: Ch3 fuels/resins → Ch6 strength-to-weight bio-composites → Ch7
life-support chemistry; no act-specific carve-outs (§8.2).

Discipline: extraction outcomes are data + a shared solver, not a
per-plant minigame. Dose/ratio framing carries the Universal
Dose-Response Principle (§3). Detailed spec:
`src/renderer/game/systems/phytochemistry/phytochemistry-substrate.md`.

### Pharmacology Substrate (BioEffectEntity)

Carry-forward system at `src/renderer/game/systems/pharmacology/`.
Answers **what biological molecules *do*** — as **mechanism**, through
experiment and simulation on the Pharmacology Bench. Introduced
alongside phytochemistry (Chapter 3) and deepening through molecular
biology (Chapter 6). The player investigates **dose-response, potency,
toxicity, adaptation, resistance, feedback loops, receptor signaling,
and metabolism** — e.g. *"investigate why willow tea reduces pain"*
following the chemistry → pathway chain.

**Pharmacology in this game is educational only — never clinical, never
therapeutic, never diagnostic (LOAD-BEARING discipline).** The player
investigates mechanisms; the player never prescribes, treats, doses a
person, or receives medical guidance. Every `effect` entry is framed as
a studied mechanism with mandatory safety annotations (toxic
look-alikes, unsafe quantities) and carries the dose-response curve. No
efficacy claim beyond the sourced evidence (Tier-3: NIH/NCCIH). This
rule is a halt-and-surface trigger if a feature drifts toward clinical
advice. The dose-response curriculum is the same one named in §2 and §3.

Today: data backbone links compounds (phytochemistry) to mechanism/
effect references; substrate not yet implemented. Shares `compoundId`
with phytochemistry/chemistry and `pathwayId` with molecular-biology
data (the Biology Workbench molecule scale). **Primitive declarations
(§8.1):** consults no environmental primitive directly (operates on
compounds/effects); updates observations + knowledge state (reserved,
§8.5). Act 1→3 scaling: Ch3 plant-effect investigation → Ch6 molecular
mechanism → Ch7 organism/ecosystem effects in the simulator; no
act-specific carve-outs (§8.2). Detailed spec:
`src/renderer/game/systems/pharmacology/pharmacology-substrate.md`.

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

### Knowledge State System

Carry-forward progression primitive at
`src/renderer/game/systems/knowledgeState/`. Owns the three-state
Seen / Interacted / Understood model named in §8.5 across every
domain in the game — species, recipes, materials, languages, NPCs,
landmarks, scientific concepts, engineering principles, cultural
knowledge. Layers on top of `state.observations` and
`state.completedQuests` rather than replacing them; existing quest
gating continues to work, with `requiredKnowledge` available as an
opt-in step gate for new quest authoring.

Today: design document landed; substrate not yet implemented. The
existing `knowledgeSystem.js` + `data/knowledgeConcepts.js`
concept-unlock pair is the seed the substrate generalizes.

Scales to: Act 1 single-region domain coverage, Act 2 region-scoped
language and cultural entries (under the §2 cultural representation
rule), Act 3 alien-domain entries and Stage-3 simulation gating.

Discipline: knowledge state and discovery state are explicitly
distinct per §8.5; conflating them is a halt-and-surface trigger.
Single state authority (the substrate is the only writer of
`state.knowledge`); all entries are data-driven; cultural entries
require a human-authored design brief.

Detailed system specification: see
`src/renderer/game/systems/knowledgeState/knowledge-state-substrate.md`.

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
- **Transportation upgrades — the vehicle-progression spine (§3) is
  the primary geographic gate: ground vehicles (bike→car) reach
  connected land regions, the boat reaches ocean/coastal regions,
  the plane reaches isolated/intercontinental regions, and the
  spacecraft leaves Earth.**
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
  Status: Refined in biology-substrate.md §15.1 (still open;
  proposed default: quest-gated, narratively appearing at Act 2
  transition when parametric work is needed for a spacecraft
  life-support module or greenhouse — blocks Stage 2
  implementation, not Stage 1).
- **Engineered-organism consequence model.** If consequences
  propagate beyond the simulator (escape, displacement, ecosystem
  damage), this needs simulation-tick architecture in the engine.
  Decision deferred but should be made before Stage 3 design.
  Status: Refined in biology-substrate.md §9 (still open; three
  models surfaced — Model A pure simulator, Model B soft
  consequence, Model C hard in-world propagation; recommended
  default Model A for Phase 3 implementation; flag for user
  decision before Stage 3 is built).
- **Portability mechanism for carry-forward systems.** Is "take
  the workbench with you" a literal inventory item? A permanent
  unlock? Part of the ship? Affects how every carry-forward system
  is architected from Act 1 onward.
  Status: Refined in biology-substrate.md §7 and §15.7 (still
  open; proposed default: permanent unlock that travels implicitly
  once narratively introduced — affects scene-mount UX, not
  substrate architecture).
- **Knowledge State System data model.** Three-state Seen /
  Interacted / Understood per §8.5. How are entries shaped, what
  domains are covered, how does the substrate coexist with
  `state.observations` and `state.completedQuests`?
  Status: Refined in knowledge-state-substrate.md §3 (entry model)
  and §13 (10 sub-questions still open — replace-vs-layer,
  granularity, mastery score, forgetting, wrong/corrected
  knowledge, region scoping, per-domain vs unified data, Stage 3
  engineered-organism entries, cultural representation encoding,
  cross-cutting bridges). Substrate document landed; §8.5 gating
  clause discharges only when implementation ships.

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
  Status: Refined in biology-substrate.md §2 (Stage 1 Recipe
  Biology introduced Act 1 with plants/medicine; Stage 2
  Parametric Biology unlocks Act 2 with greenhouse/life-support
  framing).
- How much genetic engineering is appropriate for the target age?
  Status: Refined in biology-substrate.md §15.5 (proposed default:
  5 visible parameter dimensions at first Stage 2 unlock,
  4 advanced dimensions through progression; "realistic genetic
  engineering simulation" remains explicitly out-of-scope per §14
  and arc.md §7).
- Do engineered organisms have consequences immediately, or only
  in Act 3?
  Status: Refined in biology-substrate.md §9 (Stage 3-only by
  design; Phase-3 default Model A is in-silico-only;
  cross-references the high-priority "Engineered-organism
  consequence model" question above).
- Can the player accidentally damage an ecosystem? If yes, is the
  consequence reversible?
  Status: Refined in biology-substrate.md §9 (Model C "hard
  consequence" requires reversibility tooling per arc.md §3 Act 3
  "risk, containment, reversibility"; still open).
- How to teach ethics without becoming preachy?
  Status: Refined in biology-substrate.md §10 ("Ethics is
  gameplay, not lecture" — Stage 3 simulator demonstrates
  consequences via graphed time-series; failure-as-curriculum;
  NPC dialog acknowledges outcomes but does not deliver morals).

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

## 8. World Model Alignment Layer

The carry-forward systems described in Section 4 (Construction, UTM,
Thermal Rig, Chemistry Lab, Inventory, Quest Engine) operate over a
shared world model. As more systems land — terrain, biomes, discovery
state, landmarks, knowledge state — the binding between systems and
world becomes load-bearing. The rules below are non-negotiable: agents
that violate them must halt-and-surface rather than improvise.

### 8.1 Primitive declarations on every carry-forward system

Future dispatch prompts that create or modify a carry-forward system
must explicitly declare:

- Which environmental primitives the system consults (biome, terrain).
- Which progression primitives the system updates (discovery state,
  knowledge state, landmarks).
- How the system scales Act 1 → Act 3 without diverging across acts.

Agents that don't declare these halt-and-surface, not improvise.

### 8.2 No act-specific carve-outs

A "for Act 3 only" branch in a portable system is an explicit
halt-and-surface trigger. The acts are layers of capability over one
continuous world, not separate games.

### 8.3 No biomes or landmarks without an educational domain

Visual-variety-only additions halt-and-surface. Each biome carries a
primary curriculum domain (desert → heat / water / silica; savanna →
ecology / ironworking; subtropical highland → traditional medicine +
rare earths; etc.). Each landmark anchors a system or concept (broken
bridge → structural engineering; mine → metallurgy; greenhouse →
biology workbench; observatory → spaceflight).

### 8.4 Terrain is a constraint engine, not decoration

Future construction / movement / foraging / UTM agents must consult
terrain (sand → unstable foundations; rock → strong anchors; ice →
brittle; volcanic → thermal damage). Terrain-blind systems
halt-and-surface.

### 8.5 Knowledge State System is unbuilt and gated

A three-state model — Seen / Interacted / Understood — is to be
declared in a future `knowledge-state-substrate.md` design document.
NO system may consume knowledge-state queries before that design doc
lands. If a quest / crafting / dialog agent needs "does the player
understand X?" the dispatch must halt-and-surface for the design-doc
work first.

**Status (2026-04-28):** the design document has landed at
`src/renderer/game/systems/knowledgeState/knowledge-state-substrate.md`.
See its §6 (world-model primitive integration) for the bridge contract
between discovery state (geographic) and knowledge state (conceptual),
and §8 (bridge contracts) for ecology, biology, quest engine, and
materials lab integration. The §8.5 gating clause itself remains in
force until implementation ships — substrate exists, no system yet
consumes its query API.

Discovery state (geographic) and knowledge state (conceptual) are
explicitly distinct data models with distinct query APIs — conflating
them is a halt-and-surface trigger.

### 8.6 Primitive fragmentation is CRITICAL, not MEDIUM

Reviewers checking scope should treat any bypass of world-model
primitives as a CRITICAL violation. Systems that fragment primitives
(reading biome from a hardcoded fallback string instead of the
classifier; storing a parallel discovery set; adding a landmark by
free-floating sprite scatter) are added to Section 7's out-of-scope
list.

### Audit implication for already-shipped systems

The carry-forward systems already shipped likely don't yet declare
their primitive interactions explicitly. This is a known gap, not a
regression — future modifications to those systems should add the
declaration as part of the work, not as a separate audit sweep.

### System integration declarations in shipped substrates

The three substrate design documents shipped to date each declare
their primitive integration explicitly per §8.1, satisfying the rule
above for the systems they cover:

- `src/renderer/game/systems/ecology/ecology-substrate.md` §6.
- `src/renderer/game/systems/biology/biology-substrate.md` §6.
- `src/renderer/game/systems/knowledgeState/knowledge-state-substrate.md` §6.
- `src/renderer/game/systems/ethnobotany/ethnobotany-substrate.md` §6
  (design-only; added v1.6).
- `src/renderer/game/systems/phytochemistry/phytochemistry-substrate.md` §6
  (design-only; added v1.7).
- `src/renderer/game/systems/pharmacology/pharmacology-substrate.md` §6
  (design-only; added v1.7).

Future carry-forward substrate documents must include an equivalent
"World-model primitive integration" section.

---

## 9. Open Knowledge & Data Sources

These are **substrate references** for building educational systems,
databases, quests, and world models — **not** content to copy. Evaluate
every source for ARC compatibility, record provenance and per-item
license, and **do not blindly import**. The Section 2 cultural-
representation rule and the substrate cultural/medicinal-safety
disciplines apply to everything sourced here: traditional knowledge
requires a human-authored brief and Indigenous-data-governance / CARE
handling; medicinal data requires dose-response + safety annotation and
stays educational, never clinical.

**Ethnobotany & plants.** Native American Ethnobotany Database
(naeb.brit.org), USDA PLANTS (plants.usda.gov), Native Seeds/SEARCH
(nativeseeds.org), Lady Bird Johnson Wildflower Center (wildflower.org),
Biodiversity Heritage Library (biodiversitylibrary.org).

**Plant chemistry / phytochemistry.** PubChem
(pubchem.ncbi.nlm.nih.gov), ChEBI (ebi.ac.uk/chebi), ChemSpider
(chemspider.com).

**Molecular biology.** NCBI Bookshelf, NCBI Gene (ncbi.nlm.nih.gov),
Protein Data Bank (rcsb.org), UniProt (uniprot.org), Ensembl
(ensembl.org).

**Cell biology.** Cell Image Library (cellimagelibrary.org), Allen Cell
Explorer (allencell.org), Human Protein Atlas (proteinatlas.org).

**Microbiology.** BacDive (bacdive.dsmz.de), MicrobeWiki
(microbewiki.kenyon.edu).

**Ecology.** GBIF (gbif.org), iNaturalist (inaturalist.org),
Encyclopedia of Life (eol.org).

**Agriculture.** FAO (fao.org), CGIAR (cgiar.org).

**Genetics, genomics & synthetic biology.** NCBI Gene, Ensembl, UCSC
Genome Browser (genome.ucsc.edu); iGEM Foundation (igem.org), BioBricks
Foundation (biobricks.org).

**Evolution & tree of life.** Tree of Life Web Project (tolweb.org),
OpenTreeOfLife.

**Educational content & STEM curriculum (minimum-competency targets, not
content to lift; arc.md §2 standards posture).** Khan Academy
(khanacademy.org), CK-12 Foundation (ck12.org), OpenStax (openstax.org),
NASA STEM Engagement (nasa.gov/stem — strong for Acts 2–3), Smithsonian
Learning Lab (learninglab.si.edu — inquiry-based), PhET Interactive
Simulations (phet.colorado.edu — a model for instrument-as-learning,
directly aligned with the UTM pattern).

**Open-source repositories worth mining (for ideas, mechanics,
architecture patterns, and visualizations — evaluate, do not blindly
import):** Biopython, scikit-bio, Cytoscape, CellProfiler,
OpenTreeOfLife, GBIF API tools, NCBI Datasets tools, RCSB/PDB tooling,
iNaturalist open-source projects, Allen Institute open resources.
**Reasoning & puzzle mechanics:** Simon Tatham's Portable Puzzle
Collection (bridges, nets, galaxies, flood, pattern puzzles — quest-
mechanic inspiration), Golly (cellular automata — inspiration for
ecosystems, emergence, life engineering, terraforming), Cytoscape (graph
theory for systems-thinking quests), and open Godot educational-math
examples (interaction patterns, not content).

Discipline: a source's permissive software license does **not** grant
the right to decontextualize traditional knowledge, and a dataset's
existence does not make its content age-appropriate or ARC-compatible.
Each substrate's data-build records which source, which license, and
(for cultural/medicinal content) which human review gate cleared it.

---

## 10. Design Reference Models

BikeBrowser+ is **not** modeled after one game. Each *layer* is modeled
after a different classic, and the combination is the design DNA. The
cleanest statement of the target feel:

> **Sierra-style adventure quests, inside a Zelda-like systemic world,
> with Kerbal-style engineering tests, and No Man's Sky-style
> exploration — educationally grounded like Minecraft Education,
> ecologically framed like Terra Nil, and creatively open like
> Scribblenauts.**

These map onto canon already established, not bolted on:

| Layer | Reference | What to copy | Canon it serves |
|---|---|---|---|
| Quest structure | **Sierra / King's Quest** | NPCs, inventory puzzles, story discovery, item-use quests, local places, humor | Quest Engine; Language & Geography (§5) |
| World interaction | **Zelda: BotW / TotK** | physics/chemistry sandbox, multiple solutions, environmental problem-solving | Carry-Forward systems; "relationships not facts" (§2) |
| Engineering | **Kerbal Space Program** | assemble → test → fail safely → improve; unlock parts through experiments, not lectures | Vehicle Spine (§3); UTM pattern; prediction-precedes-intervention (§2) |
| Exploration | **No Man's Sky** | scanning, cataloging, planetary/regional discovery, resource identity | Map discovery; Unified Biological Knowledge Graph (§3) |
| Learning | **Minecraft Education** | grade-level STEM integration, build challenges, student agency | Reasoning substrate; standards posture (§2) |
| Ecology / terraforming | **Terra Nil** | restoration and stewardship, terraforming without conquest, leaving without harm | Act 3; Biological Engineering "not a power fantasy" (§3) |
| Creative reasoning | **Scribblenauts** | creative problem-solving through object/system combination | weird-zones (§6); systems_thinking reasoning |
| Cause-effect puzzles | **The Incredible Machine / Opus Magnum / Baba Is You** | clean cause→effect engineering, rule-as-mechanic | UTM instruments; logical_deduction |
| Travel/discovery | **Oregon Trail / Carmen Sandiego** | travel, geography, resource decisions as learning | §5 geography; estimation reasoning |

**What NOT to copy (these reinforce §7 Out of Scope):** Sierra's dead
ends / unfair "guess-the-verb" puzzles; Zelda's combat-first
progression; too much orbital math too early (Kerbal); No Man's Sky's
repetitive harvesting grind; battle-royale/combat identity
(Fortnite/UEFN — copy only youth-friendly pacing and polish);
quiz-format shallowness (Oregon Trail/Carmen Sandiego); and chaos without
constraint (Scribblenauts). Any feature that imports a "what-not-to-copy"
trait is a halt-and-surface trigger.

**The load-bearing shared lesson** across Sierra, Zelda, Kerbal,
Minecraft Education, The Incredible Machine, Portal, Baba Is You, Opus
Magnum, and Factorio: the best educational games rarely ask *"what is the
answer?"* — they ask *"can you figure it out?"*. That is exactly the
Educational Hierarchy (§2): Observe → Explain → Predict → Engineer →
Teach. Mensa-style / gifted reasoning enters the game **only** as harder
in-world problems tagged in the reasoning substrate, never as questions.

---

## 11. Visual & Asset Architecture (summary; see `docs/visual-architecture.md`)

The full visual/asset spec (Visual Architecture v2.0) lives in
`docs/visual-architecture.md`. Canon highlights:

- **Six asset functions** — every asset must support exploration,
  interaction, inspection, repair, simulation, education; if it cannot, it
  should not exist (mirrors §8.3).
- **RULE 1 — readability beats realism:** ≤3s to answer what/interact/
  does/why/next. Operationalizes §2 ("understand what to do next").
- **RULE 2 — everything important is modular:** part-graphs, not single
  meshes — the visual form of the carry-forward / portability discipline
  (§4). Vehicles/buildings/biology/ecology all modular.
- **Stylized realism** (Zelda / Ghibli / No Man's Sky); curious,
  optimistic, scientific, explorable (no grimdark, §7).
- **Repair states by shape, not color** (normal/worn/damaged/broken);
  Inspection → Repair → **Test** closes the loop (prediction precedes
  intervention, §2).
- **Three models per organism** — exploration (stylized) / educational
  (workbench) / data (simulation) — the visual form of the Biology
  Knowledge Graph node; food-web edges are **visible**.
- **Creative pipeline, governed by Executive Brain:** ComfyUI (concept) →
  Blender (production) → Aseprite (UI/overlays) → MiniMax (motion/audio);
  Meshy/Hunyuan3D feed Blender. Generated media never enters runtime
  directly (asset registry + playability validation). MiniMax is paid and
  defaults `plan_only`.
- **Playability Validation** (EB visual-governance) rejects assets failing
  readability / function / repairability / educational value / performance.

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
- v1.3 — 2026-04-27 — Section 8 World Model Alignment Layer added,
  promoted from orchestrator memory; primitive declarations + no
  act-specific carve-outs + no biomes/landmarks without educational
  domain + terrain-as-constraint + Knowledge State System gated +
  primitive fragmentation = CRITICAL all formalized in the document.
- v1.4 — 2026-04-28 — three substrate design documents now shipped
  and referenced: `ecology-substrate.md` (commit 784e180),
  `biology-substrate.md` (commit 784e180), and
  `knowledge-state-substrate.md` (commit 9bc7f5f). Section 4 gains
  a Knowledge State System subsection and explicit
  "Detailed system specification" pointers on Ecology Substrate
  and Biology Workbench; Section 6 marks open questions refined by
  the substrates with status lines (Stage 2 unlock trigger,
  engineered-organism consequence model, portability mechanism,
  Knowledge State System data model, plus five Biology Workbench
  sub-questions); Section 8.5 records that the knowledge-state
  design doc has landed and references its §6 bridge contract; a
  closing "System integration declarations in shipped substrates"
  note in Section 8 records that the three substrates each declare
  their primitive integration per §8.1. Existing arc.md prose is
  preserved verbatim except for these additive references and
  status markers.
- v1.5 — 2026-06-02 — Mechanical Progression Spine adopted: the
  seven-rung vehicle ladder (bike → e-bike → motorcycle → car →
  boat → plane → spacecraft), each repaired then built, becomes the
  backbone the three acts are organized over. Section 1 names the
  spine; Section 3 gains a "Mechanical Progression Spine — Seven
  Vehicle Chapters" subsection (chapter table + act-grouping by
  medium: Ground Ch1–4 / Sea & Air Ch5–6 / Space Ch7) and
  reconciliation notes (Act 1 widens from Sonoran-only to overland
  Earth; the prior "build the spacecraft in Act 2" framing is
  superseded, with the Act 2 geography/resource/language prose
  retained as the supply-chain layer). Section 4 adds three
  portable carry-forward rigs introduced by the new vehicles —
  Electrical Bench (e-bike), Fluid/Buoyancy Rig (boat), Aerodynamics
  Rig (plane). Section 5 makes the vehicle tier the primary
  geographic gate. The vehicle is both the engineering curriculum
  (one new domain per rung) and the literal transportation key.
  Existing geography, culture, carry-forward, and world-model prose
  preserved; changes are additive plus the two §3 reconciliation
  notes. Open: per-chapter region/material mapping and where the
  car↔boat and plane↔spacecraft handoffs gate (candidate Section 6
  entries).
- v1.6 — 2026-06-02 — Ethnobotany Substrate adopted as a first-class
  carry-forward system alongside ecology/biology/knowledge-state. New
  design doc `src/renderer/game/systems/ethnobotany/ethnobotany-substrate.md`
  (`PlantUseEntity`) owns the plant-culture-use relationship and is the
  connective tissue between Ecology, Chemistry, Materials, Construction,
  Medicine, Agriculture, Biology, and Terraforming. Section 4 gains an
  "Ethnobotany Substrate" subsection; its progression mirrors the
  Section 3 seven-chapter vehicle spine (Ch1 direct materials through
  Ch7 closed-loop life support). Data architecture is three open-source
  tiers (Tier 1: Native American Ethnobotany DB, USDA PLANTS, Native
  Seeds/SEARCH; Tier 2: BHL, FAO, Open Context; Tier 3: PubChem, ChEBI,
  NIH herb DBs) with a region-to-source map for the seven committed
  regions. Section 8's shipped-substrate integration list adds the
  ethnobotany doc (design-only). The Section 2 cultural-representation
  rule is made load-bearing for this system: all culturally-attributed
  and ceremonial content requires a human-authored design brief and
  sourced provenance (Indigenous-data-governance / CARE principles),
  registration refuses unreviewed cultural content, and medicinal
  entries require dose-response + safety annotations. Open: knowledge-
  state coupling timing, depletion model, chapter-scope gating, the
  cultural-content review pipeline, compound granularity, and the
  terraforming-promotion contract (the doc's Section 13).
- v1.7 — 2026-06-02 — Unified Biological Knowledge Progression adopted.
  Section 2 gains the canonical biology rule ("Biology is the living
  equivalent of the Materials Lab"; the loop Observe → Test → Model →
  Predict → Engineer) and the explicit "relationships, not facts" canon
  rule. Section 3 gains a "Biological Progression Spine — Seven
  Biological Domains" subsection mapping each vehicle chapter to a
  biological domain (bike→Ecology, e-bike→Ethnobotany,
  motorcycle→Phytochemistry, car→Cellular Biology, boat→Microbiology,
  plane→Molecular Biology, spacecraft→Systems Biology & Life
  Engineering), the Unified Biological Knowledge Graph (one shared
  entity with Ecology/Culture/Uses/Chemistry/Pharmacology/Cellular/
  Molecular/Systems/Gameplay facets; the Willow worked example), the
  Universal Dose-Response Principle as a canonical cross-cutting theme,
  and a reaffirmed "simulation before deployment" rule. Section 4 adds
  two new carry-forward substrates — Phytochemistry (`CompoundUseEntity`)
  and Pharmacology (`BioEffectEntity`, educational-only / never clinical)
  — and a "Biology Workbench — observation-scale modes and instruments"
  subsection that reconciles the existing interaction-mode stages
  (Recipe → Parametric → Simulation, preserved verbatim) with the new
  observation-scale axis (organism → cell → molecule → system) and adds
  six portable instruments (Extraction Bench, Microscope, Growth
  Chamber, Fermentation Bench, Pharmacology Bench, Ecosystem Simulator).
  New design docs: `phytochemistry-substrate.md`,
  `pharmacology-substrate.md`. New Section 9 "Open Knowledge & Data
  Sources" curates open databases and repositories as substrate
  references with a do-not-blindly-import + cultural/medicinal-safety
  discipline. Section 8's shipped-substrate list adds the two new docs.
  All prior canon — UTM pattern, vehicle spine, three acts, carry-forward
  systems, world-model alignment, knowledge state, portability, weird
  zones, ecology substrate, and the Biology Workbench's existing stages —
  preserved; changes are additive. Cellular/molecular/microbiology/
  systems biology are modes/scales of the one Biology Workbench, not
  separate minigames (no new substrate docs for them). Open: where
  phytochemistry/pharmacology gate exactly, the two-axis unlock
  ordering, and the cell/molecule data depth (candidate Section 6
  entries).
- v1.8 — 2026-06-02 — Educational hierarchy, biological engineering, and
  standards posture added. Section 2 gains the permanent **Educational
  Hierarchy** (Observe → Explain → Predict → Engineer → Teach), the
  **prediction-precedes-intervention** canon rule (the player may not
  modify a system until they can accurately predict it — bridges through
  genetic systems), and the **academic-standards posture** (Arizona =
  minimum mastery; advanced states = enrichment; gifted frameworks =
  optional depth; no enrichment ever required for progression; tagging
  lives in `reasoning-substrate.md`, never school-style questions).
  Section 3's Biological Progression Spine gains an "Act 3 capstone —
  Biological Engineering (genetic engineering, reframed)" subsection:
  genetic engineering is included but reframed as Synthetic Biology /
  Biological Engineering / Terraforming Ecology — the culmination of the
  whole spine, never a gene-editing minigame — with a five-stage
  progression (Selective Breeding → Microbial Engineering → Synthetic
  Biology → Life Support Engineering → Terraforming Biology), new domains
  (Genetics, Genomics, Synthetic Biology, Evolutionary Biology), and the
  canon safety rule "Biological Engineering is not a power fantasy"
  (stewardship over domination; Simulation → Containment → Small-scale →
  Ecosystem review → Release). Section 4 adds four Biological-Engineering
  instruments (Genetics Workbench, Trait Simulator, Population Simulator,
  Genome Simulator), all modes of the one Biology Workbench. Section 9
  adds genetics/genomics/synthetic-biology and evolution sources. New
  companion docs this cycle: `reasoning-substrate.md`, and the expanded
  `biology-substrate.md` cellular/microbiology/molecular/systems +
  biological-engineering modes. All prior canon preserved; additive.
- v1.9 — 2026-06-02 — Design reference models + reasoning/source
  expansion. New Section 10 "Design Reference Models": the game is
  modeled per-layer, not after one title — Sierra (quests) / Zelda
  (systemic world) / Kerbal (engineering test loop) / No Man's Sky
  (exploration) / Minecraft Education (learning) / Terra Nil (ecology &
  terraforming) / Scribblenauts (creative reasoning), with a what-to-copy
  / what-not-to-copy table cross-referenced to §7 and the shared lesson
  ("can you figure it out?" = the Educational Hierarchy). `reasoning-
  substrate.md` gains a ninth reasoning domain, `language_reasoning`
  (ties §5 language/geography into reasoning, never vocabulary quizzes).
  Section 9 gains an educational-content tier (Khan Academy, CK-12,
  OpenStax, NASA STEM, Smithsonian Learning Lab, PhET — framed as
  minimum-competency targets, not content to lift) and reasoning/puzzle
  repos (Simon Tatham's Portable Puzzle Collection, Golly cellular
  automata, Cytoscape, Godot educational-math examples). Reaffirms that
  Mensa-style/gifted and academic-standards content enter only as
  in-world quests tagged in the reasoning substrate, never as questions.
  All prior canon preserved; additive.
- v2.0 — 2026-06-02 — Visual & Asset Architecture v2.0 added as Section
  11 (summary) with full spec in `docs/visual-architecture.md`: six asset
  functions, readability-beats-realism, modular part-graphs, stylized
  realism, repair-states-by-shape, three-models-per-organism, visible
  food-web, the ComfyUI→Blender→Aseprite→MiniMax pipeline, and the
  Executive-Brain Playability Validation gate. MiniMax (paid, motion/
  audio only) governed in Executive Brain as five plan_only privileges +
  capability + creative_pipeline_policy + playbooks. Additive; all prior
  canon preserved.
- v2.1 — 2026-06-21 — Skate Park System adopted as future canon. Section 4
  gains a "Skate Park System" subsection (placed after Construction
  System): a modular, data-driven, player-modifiable park unlocked after
  the Act 1 / Chapter 1 bridge repair — the player's first large-scale
  construction sandbox and applied-physics lab (learn momentum, friction,
  trajectory, center of mass, structural limits by riding/building, not by
  lecture). Human-powered core (BMX → scooter → skateboard; e-bike/moto
  stunt areas are future separate sections); five-level progression
  (neighborhood → expanded → community-funded → engineering → regional
  showcase); obstacles expose height/angle/radius/surface/friction/material
  (same schema as the Materials Lab + Construction System); layouts live in
  `public/layouts/`; reasoning quests + community layer + the five
  educational levels (Observe→Explain→Predict→Engineer→Teach) made visible;
  carry-forward to vehicle/aircraft/spacecraft + future BMX-park/moto-track/
  obstacle-course/testing-ground layouts on one generic layout system.
  Section 3 (Act 1) notes the post-bridge unlock in "Systems introduced."
  Recorded as future canon behind the current Act-1 playtest scope freeze —
  contract fixed, not yet built. Additive; all prior canon preserved.
