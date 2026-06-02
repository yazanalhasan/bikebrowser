# BikeBrowser+ Visual Architecture v2.0 — Modular Assets + MiniMax Creative Pipeline

Companion to `arc.md` (strategic vision) and the substrate docs. This is
the **visual and asset architecture**: how the world looks, how every
asset is built, and how the creative pipeline is governed. It is additive
to canon and inherits all arc.md discipline (UTM pattern, carry-forward,
portability, world-model alignment, knowledge graph, the
"relationships-not-facts" / prediction-precedes-intervention rules).

Target feel: **Sierra Quest + Zelda + No Man's Sky + Kerbal + Minecraft
Education + Studio Ghibli** — while staying educational, readable,
moddable, repairable, explainable, and performant.

---

## 0. The Six Asset Functions (the existence test)

Every asset must support all six:

1. **Exploration** — it can be found and approached.
2. **Interaction** — it responds to the player.
3. **Inspection** — it can be examined up close.
4. **Repair** — it has a state that can be improved (where applicable).
5. **Simulation** — it has a data model a system can run.
6. **Education** — it teaches something.

> **If an object cannot support these functions, it should probably not
> exist.** (Asset out-of-scope trigger.) This mirrors arc.md §8.3 — "no
> biomes or landmarks without an educational domain."

## RULE 1 — Readability beats realism (load-bearing)

Within **2–3 seconds** the player must answer: *What is this? Can I
interact with it? What does it do? Why is it important? What should I do
next?* Never trade clarity for fidelity. Readability is the first
acceptance gate (see §10 Playability Validation), and it operationalizes
arc.md §2 ("the player can understand what to do next").

## RULE 2 — Everything important is modular

Do not build `Bike.png`. Build a **part graph**. Modularity applies to
bikes, boats, aircraft, spacecraft, buildings, laboratories, biology, and
ecology. This is the *visual* expression of the carry-forward / portability
discipline (arc.md §4): a part is owned by the player and reused across
contexts; a wheel is a wheel whether on a bike or a rover.

## VISUAL STYLE — Stylized realism

Between **Zelda / Ghibli / No Man's Sky**. Avoid hyper-realism, dark
realism, gritty survival aesthetics. The world feels **curious,
optimistic, scientific, explorable.** (Reinforces arc.md §7 out-of-scope:
no grimdark tone.)

---

## 1. Master Creative Pipeline — tool roles (governed by Executive Brain)

| Tool | Primary role | Output stage | Never |
|---|---|---|---|
| **ComfyUI** | concept art (characters/props/environments) | **references** | final production assets |
| **Blender** | production models, modular assets, rigs, vehicles, buildings, creatures | **production** | — (primary content tool) |
| **Aseprite** | icons, UI, inventory, diagrams, repair overlays | **production (2D)** | 3D/world geometry |
| **Meshy** | rapid 3D prototyping | **prototype/reference** | final production assets |
| **Hunyuan3D** | rapid biological asset generation | **prototype/reference** | final production assets |
| **MiniMax** | animation, cutscenes, music, voice, educational videos | **motion/audio (references + delivered media)** | final **static gameplay** assets |

Pipeline order: **ComfyUI (concept) → Blender (production) → Aseprite (UI/
overlays) → MiniMax (motion/audio).** Meshy/Hunyuan3D feed prototypes
*into* Blender; they never ship directly (this is exactly arc.md's
"generated art may not directly enter runtime" rule). Every tool is
governed by EB privileges; paid tools default to `plan_only` and require
promotion (§11).

---

## 2. Vehicle System — vehicles are educational instruments

Every vehicle is **modular**, and each component has **health, wear, a
repair state, and educational metadata.** Players learn how the machine
works by repairing and testing it (the Kerbal build→test→fail→improve
loop, mapped to the vehicle spine in arc.md §3).

### Bike (the Chapter-1 reference machine)
```
Bike
├─ Frame      ├─ Fork       ├─ Front Wheel  ├─ Rear Wheel
├─ Tire       ├─ Tube       ├─ Chain        ├─ Cassette
├─ Brake (F)  ├─ Brake (R)  ├─ Pedals       ├─ Handlebars
├─ Battery    ├─ Controller ├─ Motor        └─ Cargo Rack
```
(Battery/Controller/Motor are the **e-bike, Chapter 2** unlock — the same
part graph deepens with the vehicle spine.)

### Repair states — never color-only
Every repairable component has four states expressed by **shape,
silhouette, deformation, and missing pieces** (not color):
```
chain_normal · chain_worn · chain_damaged · chain_broken
```
A child must recognize *"the chain is broken"* instantly. (Color may
reinforce, never carry, the signal — accessibility + RULE 1.)

### Inspection Mode (the repair loop)
```
Gameplay → Inspection View → Component Selection → Repair → Test
```
The player clicks a component (Wheel / Brake / Chain / Motor / Battery)
and zooms directly to it. Repair then **Test** closes the loop — you must
verify the fix works (prediction-precedes-intervention, arc.md §2).

### Aircraft (Chapter 6) and Spacecraft (Chapter 7)
Same modular philosophy; every component repairable, inspectable,
explainable.
```
Aircraft:    Wing · Tail · Propeller · Engine · Landing Gear ·
             Fuel Tank · Control Surface · Cockpit
Spacecraft:  Command Module · Habitat · Solar Array · Reaction Wheel ·
             Thruster · Fuel Tank · Life Support · Radiator ·
             Docking Port · Cargo Bay
```
Educational focus is always *"how does this system work?"*, never *"can
you memorize its name?"*.

---

## 3. Modular Building System

Buildings are **assembled from modules**, never shipped as one mesh
(`BiologyLab_Final.glb` is forbidden — same rule as runtime art). Four
tiers:

- **Structural** (reusable everywhere): Foundation, Wall, Roof, Door,
  Window.
- **Functional** (gameplay objects): Workbench, Storage, Generator, Solar
  Panel, Water Tank.
- **Educational** (knowledge objects): Biology / Chemistry / Ecology /
  Engineering Displays.
- **Decorative** (flavor): Plants, Posters, Furniture, Lighting.

### Building readability rule
A child must understand **"what is learned here?"** *from outside* —
visual language, not signage alone:
- **Biology Lab:** plants outside, microscope icon, green color language.
- **Chemistry Lab:** glassware, molecules, reaction diagrams.
- **Engineering Shop:** tools, gears, machine parts.

This is the building-scale version of RULE 1.

---

## 4. Biology System — three models per organism

Every organism ships **three coordinated representations**, matching the
Biology Knowledge Graph node (one `speciesId`, many facets):

1. **Exploration Model** — stylized, used in the world (find/scan it).
2. **Educational Model** — scientific, used in the Biology Workbench
   (microscope/cell/molecule views).
3. **Data Model** — non-visual, used in simulation (the food-web /
   knowledge-graph facets).

The three must agree (the stylized saguaro, the workbench saguaro, and the
simulated saguaro are the same entity).

### Plant growth stages (modular over time)
```
Seed → Seedling → Young → Mature → Flowering → Fruit
```
Growth is data-driven (ties to the Growth Chamber instrument and the
biology dataset's `cellular`/`molecular` facets).

### Pollination & Food-Web visualization (relationships are VISIBLE)
The Food-Web substrate's edges (Phase-4 design) must be **shown, not
hidden**:
```
Plant → Bee → Fruit         (pollination)
Organism → Food / Predator / Pollinator / Decomposer   (food web)
```
Discovering an edge is a visible link, and the Ecosystem Simulator renders
the graph the player has uncovered. (No Man's Sky scanning over a real
graph; arc.md knowledge-graph made visual.)

---

## 5. Character System — the NPC pipeline

```
Concept Sheet (ComfyUI: front/side/rear/expressions)
  → Canon Review (Executive Brain: silhouette, age, culture, biome)
  → Production Model (Blender, 10k–20k triangles)
  → Animation references (MiniMax: idle/talk/point/celebrate/work/teach)
```
**Canon Review is governed** — cultural representation passes the arc.md
§2 human-brief / CARE gate (no agent-authored cultural identity). MiniMax
produces animation **references**, not final static rigs.

---

## 6. Educational Animations (MiniMax as the education-animation engine)

30–90s clips that *show* mechanisms (the visual form of "Observe → Explain
→ Predict"):
- **Biology:** pollination, photosynthesis, DNA→RNA→Protein, evolution.
- **Chemistry:** molecules, reactions, dose-response.
- **Engineering:** forces, aerodynamics, propulsion.
- **Astronomy:** eclipses, orbits, planetary systems.

These are **references/delivered media**, never gameplay-blocking, and are
governed by the `minimax_video`/`minimax_animation` privileges (plan_only
by default).

## 7. Music System (MiniMax Music)

Each biome gets four cues: **exploration, discovery, mystery, completion.**
- **Sonoran Desert:** nylon guitar, hand percussion, flute — curiosity,
  wonder, warmth.
- **Space:** synth + orchestral hybrid — awe, scale, discovery.

## 8. Sound Effects (MiniMax Audio)

- **Repair:** wrench, chain, brake adjustment, tire inflation.
- **Biology:** microscope, sample collection, growth chamber.
- **Engineering:** welding, drilling, assembly.
- **Environment:** birds, insects, wind, rain.

---

## 9. Asset metadata schema (what every asset record carries)

```
asset:
  id:
  kind:            vehicle_component | building_module | organism_model |
                   character | icon | animation | music | sfx
  modelTier:       concept | prototype | production   # source tool implied
  sourceTool:      comfyui | blender | aseprite | meshy | hunyuan3d | minimax
  modular:         { parentId, partOf: [...] }         # the part graph
  repair:          { states: [normal, worn, damaged, broken],
                     signal: [shape, silhouette, deformation, missing] }  # not color-only
  functions:       [exploration, interaction, inspection, repair,
                    simulation, education]             # the six; ≥1 each
  educationalMeta: { teaches: [...], hierarchyLevel, reasoningTags,
                     biologicalDomain|engineeringDomain }
  graphNode:       speciesId | componentId | null      # links to knowledge graph
  provenance:      { license, reviewedBy|null }         # cultural/asset gate
  performance:     { triBudget, lod }
```

## 10. Playability Validation (Executive Brain rejects failing assets)

EB's visual-governance gate (`brain/visual_governance/`, `brain/reviewers/`)
must **reject** any asset that fails any of:

- **Readability** — can a child identify it (≤3s)? (RULE 1)
- **Function** — can a child understand what it does?
- **Repairability** — can a child identify what is broken? (state legible
  by shape, not color)
- **Educational value** — does it teach something? (the six functions)
- **Performance** — does it run smoothly? (tri-budget / LOD)

A failing asset is `BLOCKED` with the failed criterion named — same
fail-closed, evidence-first posture as the act-1 acceptance audit.

## 11. MiniMax integration (governed by Executive Brain)

MiniMax is the only **new** pipeline tool (ComfyUI/Blender/Aseprite/Meshy/
Hunyuan3D are already governed). It is **paid**, so per EB policy:

- **Privileges** (5): `minimax_video`, `minimax_voice`, `minimax_music`,
  `minimax_audio`, `minimax_animation` — **default `plan_only`**;
  promotion to `governed_execute` required for any paid call (every paid
  call also needs `paid_use` approval).
- **Capabilities / playbooks / workflows** live in EB procedural memory
  (`memory/procedural/...`), with the creative-pipeline policy enforcing
  tool roles and the playability gate.
- **Never** used for final static gameplay assets (Blender/Aseprite own
  those).

See the Executive Brain repo: `memory/procedural/capabilities/minimax.yaml`,
`tool_playbooks/minimax_*.md`, `creative_pipeline_policy.yaml`, and the
`minimax_*` privilege entries.

---

## Final Rule

> The player should never be repairing **an icon**. They should be
> repairing **a visible component of a visible machine that they
> understand.** Every graphic, animation, sound, and building reinforces
> that philosophy.
