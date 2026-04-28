# Knowledge State Substrate Design — Seen / Interacted / Understood

**Status:** Phase-2 design document. No code is shipped by this document.
This is the third carry-forward substrate identified in `arc.md` (parallel
to `ecology-substrate.md` and `biology-substrate.md`). Implementation
dispatches are gated on this document landing and on resolution of the
open questions in §13.
**Verdict tag:** `[design-only]` — upgrades to `runtime-validated` only
when implementation ships.

**Companion documents (read alongside):**
- `arc.md` — strategic vision (especially §4 "Carry-Forward Systems",
  §6 "Open Design Questions", §8 "World Model Alignment Layer", §8.3
  "No biomes or landmarks without an educational domain", §8.5
  "Knowledge State System is unbuilt and gated", §8.6 "Primitive
  fragmentation is CRITICAL", §2 "Cultural representation rule",
  §9 ≈ §7 "Out of Scope"). Note: arc.md §8.5 is the gating clause
  this document discharges.
- `src/renderer/game/systems/ecology/ecology-substrate.md` — sibling
  substrate; §6 (world-model primitive integration) and §7 (Stage
  progression / Biology bridge) are the pattern this document follows.
- `src/renderer/game/systems/biology/biology-substrate.md` — sibling
  substrate; §6 (primitive integration), §8 (Ecology bridge contract),
  and §15.8 (cross-cutting open questions) describe the bridge contract
  this document must agree with.
- `.claude/plans/items-1-8-playbook-2026-04-27.md` §A.8 — the design
  conversation placeholder this document fulfills.
- `src/renderer/game/data/quests.js` — current implicit knowledge
  tracking lives in quest step gating against `state.observations` and
  `state.completedQuests`.
- `src/renderer/game/data/items.js` — items are the surface that "I
  have it / I have used it" knowledge currently lives on.
- `src/renderer/game/systems/saveSystem.js` — canonical save shape.
  Already includes a `state.knowledge` field shaped by the current
  `knowledgeSystem.js` (see §3 below), which this substrate generalizes
  rather than replaces.
- `src/renderer/game/systems/knowledgeSystem.js` and
  `src/renderer/game/data/knowledgeConcepts.js` — the existing
  concept-unlock implementation. This substrate **layers on top of and
  generalizes** these; the migration story is in §9.

---

## 1. Purpose

**Role.** The Knowledge State substrate at
`src/renderer/game/systems/knowledgeState/` is the carry-forward system
that tracks what the player **has seen, has interacted with, and
understands** across every domain in the game — species, recipes,
materials, languages, locations, NPCs, scientific concepts, engineering
principles, and cultural knowledge. It formalizes the three-state model
named in `arc.md` §4 (Seen / Interacted / Understood) and discharges
the gating clause in `arc.md` §8.5. Per `arc.md` §8.5 it is a
**progression primitive** parallel to but explicitly distinct from
discovery state (which is geographic). It is portable per `arc.md` §4
"Portability Principle" — the player's knowledge travels with them
across acts and across scenes; it is not scene-attached.

**Not.** The Knowledge State substrate is **not** a renderer. It does
not own UI surfaces — knowledge journals, error explanations, and
quiz overlays are scene-side concerns. It does not own the *content* of
knowledge entries — those live in `data/` (today
`data/knowledgeConcepts.js`, eventually a wider set of per-domain
tables). It does not duplicate the species observation surface
(`ecology.observation`) — ecology pushes species observations to
`state.observations`, and the substrate **listens** to surface those as
Knowledge entries; it does not push species ids to
`state.observations` itself. It does not own quest definitions or the
quest engine. It does not own discovery state per `arc.md` §8.5 —
discovery (geographic) and knowledge (conceptual) are explicitly
distinct data models with distinct query APIs; conflating them is a
halt-and-surface trigger. It does **not** replace `state.observations`
or `state.completedQuests` — those remain the authoritative low-level
surfaces; the substrate layers a richer model on top and migrates
gracefully (§9).

**Curriculum served.** Per `arc.md` §1 ("teaches systems thinking by
letting the same core toolkit scale upward") and §2 ("children learn
complex science best when abstract systems are introduced first as
useful tools in a concrete world, then reused at increasing
complexity"), the Knowledge State substrate is the substrate that lets
the *same concept* — say, "dose-response" — be Seen on a desert
foraging walk, Interacted with in a chemistry lab tincture, and
Understood when the player reliably sets a safe dose for a new
medicine in an unfamiliar biome. It serves Act 1 (foraging /
chemistry / bike mechanics — concept-introduction), Act 2 (regional
expansion / spacecraft modules — concept-application across cultures
and contexts), and Act 3 (terraforming / Stage 3 simulation biology
— concept-mastery sufficient to design a closed-loop ecosystem). It is
the substrate that makes "the player has Understood concept X" a
**queryable fact** future quest, dialog, crafting, and Stage 3 systems
can gate on without inventing parallel tracking.

---

## 2. Three-state model

Per `arc.md` §4 the model is **Seen → Interacted → Understood**. Each
state is a strict superset of the previous; transitions are monotonic
in normal play (regression is governed by the open question in §13.4).

### 2.1 Seen

**Semantics.** The player has *visually encountered* the entity / concept
*as a labeled thing the game named*. Seeing a saguaro silhouette in the
distance is not Seen until the game labels it (proximity tooltip,
inspect text, NPC mention, or a directly-targeted observation event).

**Trigger entry (canonical sources).**
- `ecology.observation` event from the ecology substrate (proximity or
  inspect on a species).
- `npc.met` event from dialogue when an NPC introduces themself.
- `item.acquired` event when a new item id enters inventory.
- `recipe.shown` event when the workbench reveals a recipe slot.
- `landmark.entered` event from the world model when a labeled landmark
  is approached (`arc.md` §8.3).
- `language.term.encountered` event when an NPC speaks a term in a
  region's language.
- Programmatic push: `knowledgeState.markSeen(id, source)` for
  cutscenes, journal entries, or one-off scripted reveals.

**What it gates.** Tooltips ("you've seen this before"), journal
listings, the prerequisite for any quest step that asks "have you ever
seen X?". A future field-guide / encyclopedia UI shows Seen entries as
silhouettes-with-labels.

**What it does NOT gate.** Crafting recipes, advanced quest steps, or
Stage 3 simulation. Seeing a creosote bush does not unlock the ability
to extract its resin — that is Interacted (§2.2).

### 2.2 Interacted

**Semantics.** The player has *used or tested or applied* the entity /
concept in a way that produced an observable game outcome (success or
failure). Interacted is "I picked it up, dropped it in the workbench,
spoke the phrase, mounted the part, ran the test, completed the
inspect-step." It is the state most current quest gating already uses
implicitly via `requiredObservation` + `requiredItem`.

**Trigger entry (canonical sources).**
- `ecology.forage` event when the player forages a species (the
  "test by use" surface for plants).
- `biology.recipe.attempt` event (success **or** failure) — both
  succeed and fail count as Interacted; the curriculum is "test before
  trust" per `arc.md` §3.
- `biology.organism.designed` event (Stage 2).
- `materialsLab.test.completed` event (UTM rig run, regardless of
  outcome) — this is the canonical reference per `arc.md` §4 ("UTM
  pattern").
- `quest.step.completed` event when a step type implies hands-on work
  (`use_item`, `inspect`, `quiz` correct or incorrect).
- `dialog.phrase.spoken` event when the player chooses a localized
  phrase (Spanish, Arabic, Quechua, etc.).
- `construction.member.placed` event in the construction system.
- Programmatic push: `knowledgeState.markInteracted(id, source)`.

**What it gates.** Quest steps that already gate on
`requiredObservation` (today: `Array.includes()` on
`state.observations`) — the substrate is the higher-level reading of
that flag. Recipe revelation that depends on having tested an
ingredient. NPC trust thresholds (per `arc.md` §5 — NPCs trust the
player more when they have used the language).

**What it does NOT gate.** Stage 3 simulation entries, advanced module
certification, or "design a thing from first principles" quest steps —
those require Understood (§2.3).

### 2.3 Understood

**Semantics.** The player can *reliably apply* the concept to a novel
problem. Understood is the state that distinguishes "I poured the
tincture into the bottle" (Interacted) from "I correctly chose the
solvent for an unfamiliar plant" (Understood). Per the Universal
Testing Machine pattern in `arc.md` §2, Understood is "the principle
landed; the player can transfer it." It is the curriculum payload of
the entire game.

**Trigger entry (canonical sources).**
- `quest.completed` event for a quest whose `teaches` field names the
  concept (today: `unlockedBy: { quest: ... }` in
  `data/knowledgeConcepts.js`). Every concept declares one or more
  unlock paths.
- `build.completed` event for a build that demonstrates the concept
  (today: `unlockedBy: { build: ... }`).
- `factory.milestone.reached` event (today:
  `unlockedBy: { factory: ... }`).
- Concept-cascade: when prerequisite concepts are all in Understood,
  the dependent concept may auto-cascade (per current
  `knowledgeSystem.js` `unlockConcept` implementation).
- Demonstrated transfer: the substrate detects N successful
  applications of an Interacted concept in distinct contexts (open per
  §13.3 — N-threshold or quest-explicit).
- Programmatic push: `knowledgeState.markUnderstood(id, source)`.
  Authored per concept; **not** auto-promoted from repeated
  Interacted entries without an explicit threshold or quest event.

**What it gates.** Advanced builds, advanced recipes, Stage 2 / Stage 3
biology unlocks (per `biology-substrate.md` §15.1 the Stage 2 unlock
trigger is open — Understood-on-the-Stage-1-recipe is one candidate),
materials certification ("you have Understood `fatigue_failure` —
spacecraft hull build is now unlockable"), language fluency
thresholds, and the `getErrorExplanation()` surface in the existing
`knowledgeSystem.js` (which today checks `unlocked.includes(...)` —
that is exactly Understood, retroactively).

**What it does NOT gate.** Per `arc.md` §1 "engineering failure as
feedback, not punishment," Understood is **not** a player-facing pass
/ fail. The player who has Interacted a concept but not Understood it
is not blocked from progression — they are routed to alternate paths,
hint dialog, or simpler builds. Understood is a *capability* state, not
a *gating* state in the punitive sense.

### 2.4 Transitions and invariants

- **Monotonic in normal play.** Seen ≤ Interacted ≤ Understood.
  Marking a higher state implies all lower states (a `markUnderstood`
  call sets all three).
- **Idempotent.** Re-firing the same event does not duplicate entries.
- **Append-only audit trail.** Each transition is recorded with a
  timestamp and source so the journal / dev tools / progression audit
  can replay how the player got here. Not a stack — once Understood,
  the entry stays Understood (forgetting model is open per §13.4).
- **Atomic to entry, not domain.** Marking a single concept
  Understood does not affect sibling concepts in the same domain
  unless prerequisite-cascade fires.

---

## 3. Knowledge entry model

A KnowledgeEntry is a runtime record produced by `registerEntry()` (or
auto-derived from data) and stored in the substrate's per-save registry.
Per arc.md §4 architectural discipline ("data definitions live in
`src/renderer/game/data/`"), the **definitions** of entries live in
data tables; the **runtime state** (which state you're in, when you
got there, source) lives in save.

### 3.1 Required fields

| Field | Type | Source | Notes |
|---|---|---|---|
| `id` | string | data table | Stable id, namespaced by domain (`species:mesquite`, `recipe:healing_salve`, `concept:torque`, `language.term:ar.salam`). |
| `domain` | string | data table | One of the canonical domains (§7). |
| `state` | `'seen' \| 'interacted' \| 'understood'` | substrate | Current state. Default is "not present" (querying an unregistered id returns `null`, NOT `'seen'`). |
| `firstSeenAt` | number \| null | substrate | Timestamp of the Seen-state transition. Null if never Seen. |
| `firstInteractedAt` | number \| null | substrate | Timestamp of Interacted transition. |
| `firstUnderstoodAt` | number \| null | substrate | Timestamp of Understood transition. |

### 3.2 Optional fields (with defaults)

| Field | Type | Default | Notes |
|---|---|---|---|
| `sources` | `{ seen?, interacted?, understood? }` of source strings | `{}` | What event / quest / build triggered each transition (e.g., `'quest:flat_tire_repair'`, `'cascade:torque'`, `'ecology.observation:proximity'`). |
| `confidence` | number 0..1 \| null | `null` | Optional mastery score for the Understood state (§13.5). Defaults to null = "binary Understood." |
| `relatedEntries` | string[] | `[]` | Other entry ids the player should consult — prerequisites, cascades, cross-domain links (e.g., concept `torque` relates to species `bike_chain` and recipe `chain_repair`). Read-only; sourced from data. |
| `regionScope` | `'universal' \| regionId[]` | `'universal'` | Region-specificity (§13.6). E.g., `language.term:ar.salam` is `regionId: ['arabian', 'sonoran']`. |
| `culturalNotes` | string \| null | `null` | A reserved field for culturally-anchored entries; per `arc.md` §2 cultural representation rule, **the substrate does not author this field**. Authoring requires a human design brief (§13.8). |
| `expectedTransition` | `'seen-to-interacted-via-X' \| ...` \| null | `null` | Optional hint for the journal UI (how do I move this forward?). Authored in data, read-only. |

### 3.3 How a KnowledgeEntry differs from observation / quest / item

- **`state.observations`** is a flat string array of "this happened"
  flags. Append-only, untyped, no transition semantics, no domain
  taxonomy. The Knowledge State substrate **listens** to observation
  pushes and **derives** entries; observations remain the canonical
  low-level event surface. Quests continue to read
  `state.observations` directly for backward compatibility (§9).

- **`state.completedQuests`** is the binary done-list of completed
  quests. The substrate listens to `quest.completed` and routes the
  quest's `teaches` field into Understood transitions for the named
  concepts. The completedQuests array remains canonical for quest
  bookkeeping.

- **`state.inventory`** is the binary have-it list of items. The
  substrate listens to `item.acquired` and routes to Seen-state for
  the corresponding `item:<itemId>` entry. Items themselves are not
  KnowledgeEntries; the *concept* the item demonstrates is the
  KnowledgeEntry.

- **A KnowledgeEntry** is a typed, domain-aware, three-state record
  with an audit trail and cross-references. It is the substrate that
  lets a quest say "did the player ever Understand `gear_ratios`?"
  without scanning observations strings or quest ids.

---

## 4. Public API

The substrate is exposed through
`src/renderer/game/systems/knowledgeState/index.js` (barrel export).
Internal modules (registry, query, eventListener, cascade engine) are
implementation details and not part of the public surface.

### 4.1 Registration

```
registerKnowledge(entry)             // load definition (data-additive); attaches to registry
registerKnowledgeBatch(entries[])    // bulk load on substrate init from data tables
```

`registerKnowledge` does NOT change runtime state. It tells the
substrate "this entry exists and may be transitioned later." The
runtime state for an unregistered id is "not present"; a query returns
`null`.

### 4.2 Transitions

```
markSeen(id, source)                  // → { changed: boolean, entry }
markInteracted(id, source)            // → { changed: boolean, entry }
markUnderstood(id, source)            // → { changed: boolean, entry, cascadedIds }
updateKnowledgeState(id, newState, source)
                                       // generic transition; rejects regressions unless §13.4 resolves to "regression-allowed"
```

All transitions are idempotent: re-firing the same event with the same
source does not duplicate audit-trail entries. Promotion to a higher
state is allowed; demotion (regression) is open per §13.4 — proposed
default: rejected.

### 4.3 Queries

```
getKnowledge(id)                     // → KnowledgeEntry | null
queryKnowledge(predicate)            // → KnowledgeEntry[]
knowledgeAt(state, criteria?)        // → KnowledgeEntry[]
                                       //   e.g., knowledgeAt('understood', { domain: 'biology' })
hasState(id, state)                  // → boolean (true if entry's state ≥ requested state)
hasUnderstood(id)                     // → boolean   sugar for hasState(id, 'understood')
hasInteracted(id)                     // → boolean
hasSeen(id)                          // → boolean
listByDomain(domain)                 // → KnowledgeEntry[]
listSources(id)                      // → audit trail entries
```

`hasState` is the load-bearing API. Quest gating, recipe gating, and
dialog branching MUST use `hasState` (or one of its `has*` sugar
helpers) rather than reading raw fields. This insulates callers from
schema drift.

`queryKnowledge` accepts a predicate or one of the named helpers:

```
queryKnowledge.byDomain(domain)
queryKnowledge.byState(state)
queryKnowledge.byRegion(regionId)
queryKnowledge.byTag(tag)            // e.g., 'curriculum:dose-response'
queryKnowledge.byPrerequisite(prereqId)
                                       // entries that name `prereqId` in relatedEntries
```

### 4.4 Subscription API

Per the event model (§5), systems subscribe via Phaser's global event
bus or via the substrate's lighter wrapper:

```
onKnowledgeChange(callback)          // → unsubscribe()
onKnowledgeAdded(callback)           // → unsubscribe()
onKnowledgeStateAt(state, callback)  // → unsubscribe(); fires when an entry reaches state
```

These wrap `scene.game.events.on('knowledge.state.change', ...)` etc.;
direct subscription on the global bus also works. Callbacks receive the
event payload (§5).

### 4.5 Migration helpers

```
backfillFromObservations(observations[]) // legacy hydration; see §9
backfillFromCompletedQuests(quests[])    // legacy hydration; see §9
backfillFromInventory(inventory[])       // legacy hydration; see §9
```

Called once on save load by `saveSystem.js` to upgrade pre-substrate
saves. Idempotent.

---

## 5. Event model

The substrate emits and listens for events through Phaser's global
event bus (`scene.game.events`) per the pattern established by
`ecology-substrate.md` §5 and `biology-substrate.md` §5. Events cross
scene boundaries.

### 5.1 Events emitted

#### `knowledge.state.change`

Fired on any transition (Seen → Interacted, Interacted → Understood,
or absent → Seen).

```
{
  type: 'knowledge.state.change',
  id: 'concept:torque',
  domain: 'concept',
  fromState: 'seen' | 'interacted' | null,
  toState: 'seen' | 'interacted' | 'understood',
  source: 'quest:chain_repair',
  cascadedFrom: 'concept:tire_pressure' | null,
  timestamp: <ms>,
}
```

#### `knowledge.entry.added`

Fired the first time a previously-unknown id transitions to Seen.

```
{
  type: 'knowledge.entry.added',
  id,
  domain,
  initialState: 'seen',
  source,
  timestamp,
}
```

#### `knowledge.understood.cascade`

Fired when a Understood transition triggers prerequisite-cascade
unlocks (per current `knowledgeSystem.js` cascade behavior).

```
{
  type: 'knowledge.understood.cascade',
  rootId,
  cascadedIds: string[],
  timestamp,
}
```

### 5.2 What systems listen for vs. ignore

**Quest engine should listen for:** `knowledge.state.change` —
specifically transitions to Understood, to advance any step that gates
on a `requiredKnowledge: { id, state: 'understood' }` field (proposed
new step type, additive to existing `requiredObservation`). Quest
engine should **continue** to read `state.observations` directly for
backward compatibility (§9).

**Biology workbench should listen for:** `knowledge.state.change` on
concept ids relevant to its stages. Per `biology-substrate.md` §5,
biology may listen for `knowledge.state.unlocked` (reserved name from
the biology doc; this substrate emits `knowledge.state.change` with
`toState: 'understood'` — semantically equivalent). Biology should
**not** push knowledge state for species — that is ecology's authority
(§8.1).

**Ecology substrate should listen for:** nothing today. Per
`ecology-substrate.md` §6 "Knowledge state — NOT consumed and NOT
updated," ecology continues to write `state.observations` only; the
Knowledge State substrate listens to `ecology.observation` and derives
Seen entries (§8.1). Future: ecology *may* read
`hasUnderstood('concept:dose_response')` to surface a dose-warning
tooltip on a foragable plant — that's an additive consumer, not a
required listener.

**Materials lab / construction / chemistry should listen for:**
their own domain-specific change events at most; they emit
`materialsLab.test.completed` etc. and the substrate routes those to
Interacted transitions.

**Dialog / NPC system should listen for:** `knowledge.state.change` on
language-term ids (per `arc.md` §5 — NPCs trust the player more when
they learn greetings; NPC trust thresholds gate on per-region language
entry counts at Interacted or Understood).

**Save system should listen for:** all events, persists state on a
debounced cadence (per `saveSystem.js` existing pattern).

**Renderer / UI overlays should listen for:** `knowledge.entry.added`
to flash a "new in journal" toast; `knowledge.understood.cascade` to
celebrate a chain unlock.

**Systems that should ignore:** anything not in the above list. Per
`arc.md` §4, knowledge state is a primitive; consumers self-select
through subscription.

### 5.3 Events listened for

The substrate **listens** for the events below and routes them to
state transitions. This is the primary path; direct programmatic
`markSeen` / `markInteracted` / `markUnderstood` calls exist for
cases not covered by an upstream event.

| Upstream event | Substrate action |
|---|---|
| `ecology.observation` | `markSeen('species:<speciesId>')` |
| `ecology.forage` | `markInteracted('species:<speciesId>')` |
| `biology.recipe.attempt` | `markInteracted('recipe:<recipeId>')` |
| `biology.recipe.outcome` (success) | `markInteracted('recipe:<recipeId>')`; if recipe has a `teaches` concept, `markInteracted('concept:<conceptId>')` |
| `biology.organism.designed` | `markInteracted('concept:<organism's-teaches-concepts>')` |
| `biology.simulation.outcome` | `markUnderstood('concept:<simulation's-teaches-concepts>')` (Stage 3 only) |
| `materialsLab.test.completed` | `markInteracted('material:<materialId>')` |
| `quest.completed` | for each concept in the quest's `teaches`: `markUnderstood('concept:<id>')` |
| `quest.step.completed` (type: `inspect`) | `markSeen` on the inspected entity |
| `quest.step.completed` (type: `quiz`, correct) | `markInteracted` on quiz subject |
| `build.completed` | `markUnderstood` on each `unlockedBy.build === <buildId>` concept |
| `factory.milestone.reached` | `markUnderstood` on each `unlockedBy.factory === <id>` concept |
| `dialog.phrase.spoken` | `markInteracted('language.term:<region>.<term>')` |
| `landmark.entered` | `markSeen('landmark:<landmarkId>')` |
| `npc.met` | `markSeen('npc:<npcId>')` |
| `item.acquired` (first time) | `markSeen('item:<itemId>')` |

The mapping is data-driven: `data/knowledgeConcepts.js` (and future
per-domain tables — §7) declare which upstream events trigger which
transitions on which entries. The substrate is a router, not an
authority on which events mean what.

---

## 6. World-model primitive integration

Per `arc.md` §8.1, every carry-forward system must declare the
primitives it consults and updates.

### 6.1 Environmental primitives consulted

- **Biome** — only consulted indirectly. The substrate may, on a Seen
  transition for a species, annotate the entry's `regionScope` with
  the biome from `getBiomeAt()` (per `arc.md` §8.6, no hardcoded biome
  strings). This is an annotation, not a gate.
- **Terrain** — not consulted.
- **Time of day** — not consulted directly. The substrate's transitions
  are time-of-day-agnostic (a saguaro Seen at noon is the same Seen as
  a saguaro Seen at dawn).

### 6.2 Progression primitives updated

This is the substrate's primary role. **Knowledge state IS a
progression primitive** per `arc.md` §8.1 — distinct from but parallel
to discovery state, landmarks, and observations.

- **Knowledge state** — owned. The substrate is the single writer.
  Other systems subscribe but do not write.
- **Observations** — read-only. The substrate listens to
  `state.observations` pushes (via the events that produced them) and
  derives entries; it does not push to `state.observations` itself.
  Per `arc.md` §8.5, this is the "discovery state and knowledge state
  are explicitly distinct" rule applied to the observations surface
  too — observations are an event log, knowledge is a typed model.
- **Discovery state** — not updated. Discovery is geographic per
  `arc.md` §8.5; visiting a region updates discovery, learning what
  the region's resources are updates knowledge. They diverge: the
  player can have Discovered the Anatolian Plateau (geographic) without
  having Understood `boron_metallurgy` (conceptual), and vice versa.
- **Landmarks** — not updated. The substrate **does** auto-mark
  `landmark:<id>` entries Seen on `landmark.entered`, but the landmark
  registry itself is owned by a future landmark substrate (referenced
  in `arc.md` §8.3, not yet authored).
- **Completed quests / inventory / builds** — read-only, listen-only.

### 6.3 Discovery state and knowledge state coexistence

Per `arc.md` §8.5: "Discovery state (geographic) and knowledge state
(conceptual) are explicitly distinct data models with distinct query
APIs — conflating them is a halt-and-surface trigger."

Concrete contract:

- **Discovery state** lives in `state.discovery` (per `saveSystem.js`)
  and is owned by `discoverySystem.js`. It tracks **where** the player
  has been — fog-of-war tiles, world-map exploration. Its query API is
  `isDiscovered(x, y)` style.
- **Knowledge state** lives in `state.knowledge` (already present per
  `saveSystem.js` defaults) and is owned by this substrate. It tracks
  **what the player has Seen / Interacted / Understood** — typed by
  domain. Its query API is `hasState(id, state)`.
- The two **may overlap on specific surfaces** (a landmark is both
  Discovered geographically and Seen conceptually) but they remain
  separate state stores with separate writers.
- A future quest that needs "discover N regions AND understand N
  concepts" composes from both APIs; it does not query a unified store.

### 6.4 Act 1 → Act 3 scaling (per `arc.md` §8.1)

- **Act 1.** Single region (Sonoran). Domain coverage: species (via
  ecology bridge), recipes (via biology bridge Stage 1), items, NPCs,
  language.terms (Spanish, Arabic), concepts (the existing
  `knowledgeConcepts.js` set covers Act-1-relevant concepts —
  `tire_pressure`, `torque`, `friction`, `chemical_extraction`, etc.).
  No regional disambiguation needed.
- **Act 2.** Six committed regions (Mexico/Andes, Arabian, Anatolian,
  Zagros, Swahili, Yunnan). The `regionScope` field of an entry
  becomes load-bearing — `concept:lapis_lazuli_chemistry` is scoped to
  Zagros; `language.term:sw.karibu` is scoped to Swahili. Per `arc.md`
  §2, naming any culturally-anchored entry in Act 2 requires a
  human-authored design brief (§13.8). The substrate's data shape
  supports the entries; the entries themselves are authored under that
  rule.
- **Act 3.** Same schema. Alien-domain entries register through the
  same mechanism. Stage-3 simulation biology consumes
  `hasUnderstood('concept:closed_loop_ecology')` etc. as gating for
  advanced ecosystem templates. Per `arc.md` §8.2, no act-specific
  carve-outs.

---

## 7. Domain coverage

The substrate is **domain-pluggable**. A domain is a string namespace
(`species`, `recipe`, `material`, `language.term`, `location`,
`landmark`, `npc`, `concept`, `item`, `cultural`) plus a registration
hook describing which upstream events route to which transitions.

### 7.1 Initial committed domains

| Domain | Example id | Source data | Transition triggers |
|---|---|---|---|
| `concept` | `concept:torque` | `data/knowledgeConcepts.js` (existing) | `quest.completed`, `build.completed`, `factory.milestone.reached`, prerequisite-cascade |
| `species` | `species:mesquite` | `data/flora.js`, `data/fauna.js` | `ecology.observation` (Seen), `ecology.forage` (Interacted) |
| `recipe` | `recipe:healing_salve` | `data/recipes.js` | `recipe.shown` (Seen), `biology.recipe.attempt` (Interacted), `biology.recipe.outcome` (Understood after N successes — open per §13.3) |
| `material` | `material:steel_alloy` | `data/materials.js` | UTM rig usage events; certification events |
| `language.term` | `language.term:ar.salam` | `data/languages.js` | `language.term.encountered` (Seen), `dialog.phrase.spoken` (Interacted), per-region Understood threshold (open per §13.3) |
| `location` | `location:tempe_canal_path` | `data/regions.js` / scene metadata | `landmark.entered`, `region.discovered` |
| `landmark` | `landmark:broken_bridge` | future landmark registry per `arc.md` §8.3 | `landmark.entered` |
| `npc` | `npc:mrs_ramirez` | `data/npcProfiles.js` | `npc.met`, `dialog.completed` |
| `item` | `item:tire_lever` | `data/items.js` | `item.acquired` (Seen), `item.used` (Interacted) |
| `cultural` | `cultural:<authored-id>` | per-region human-authored data brief | per-brief; the substrate's data shape supports it but **entries themselves are not authored by this dispatch** per `arc.md` §2 |

### 7.2 Domain registration

A domain registers itself by adding a row to a single
`data/knowledgeDomains.js` table (proposed; does not exist today). Each
row declares:

```
{
  id: 'species',
  source: { tables: ['flora', 'fauna'] },
  triggers: [
    { event: 'ecology.observation', mark: 'seen',       idFrom: 'speciesId' },
    { event: 'ecology.forage',      mark: 'interacted', idFrom: 'speciesId' },
  ],
  understoodPolicy: 'never-auto' | 'after-N-interactions:<n>' | 'quest-only',
  defaultRegionScope: 'universal' | 'region-of-source-data',
}
```

The substrate reads this table on init and wires the routes. Adding a
new domain is a `data/` addition + (optionally) new event emitters in
the relevant upstream system. The substrate code does not change.

### 7.3 Per-domain or unified data file?

**Open per §13.7.** Proposed default: **unified** for the registry
(`data/knowledgeDomains.js`), **per-domain** for the entries
themselves. Domain entries already live in their own files
(`data/flora.js` for species, `data/recipes.js` for recipes,
`data/knowledgeConcepts.js` for concepts, etc.). The substrate
*derives* its registered ids from those files — it does not duplicate
the entry definitions. This avoids the data fragmentation footgun per
`arc.md` §8.6 (single source of truth per concept).

---

## 8. Bridge contracts with other substrates

This section pairs with `ecology-substrate.md` §6 and §7,
`biology-substrate.md` §6 and §8, and the Quest Engine. The contracts
below are the **only** writes from those systems into this substrate.
Drift between this section and the sibling docs is non-shippable per
the cross-consistency rule established by the ecology / biology
dispatches.

### 8.1 Ecology bridge

**What ecology asks.** Nothing direct. Ecology continues to write
`state.observations` and emit `ecology.observation` /
`ecology.forage` per `ecology-substrate.md` §5.

**What knowledge state asks of ecology.** Stable speciesIds. Stable
event payload shape (the substrate listens to the existing payload
defined in `ecology-substrate.md` §5).

**What knowledge state guarantees ecology.** It will route observation
events to `species:<speciesId>` Seen transitions, and forage events to
Interacted transitions. It will **not** write to `state.observations`
or to any ecology-owned state. Per `ecology-substrate.md` §6
"Knowledge state — NOT consumed and NOT updated" — that document was
written when this substrate did not exist; the contract upgrades
to "ecology emits, knowledge state listens" the moment this substrate
ships.

**Exchange format.** Read-only event subscription. No new exchange
shape required.

### 8.2 Biology bridge

**What biology asks.** Per `biology-substrate.md` §5 "Events listened
for → `knowledge.state.unlocked` (deferred)": once this substrate
lands, biology subscribes to `knowledge.state.change` on concept ids
to gate advanced recipes / parametric ranges / ecosystem templates.

**What knowledge state asks of biology.** Stable recipe / organism /
ecosystem ids. Stable event payload shapes. Each recipe definition in
`data/recipes.js` should declare its `teaches: conceptId[]` so the
substrate can route success outcomes to concept Understood
transitions.

**What knowledge state guarantees biology.**
- `recipe:<recipeId>` Seen on `recipe.shown`.
- `recipe:<recipeId>` Interacted on `biology.recipe.attempt`.
- `concept:<id>` Interacted on `biology.recipe.outcome` (success).
- `concept:<id>` Understood after N successful outcomes in distinct
  conditions (open per §13.3) OR after the quest gating that recipe
  completes.
- Stage 3 outcomes (`biology.simulation.outcome`) drive Understood for
  ecosystem-level concepts (per `biology-substrate.md` §5).

**Exchange format.** Subscription-based. The biology substrate's
public API is unchanged; this substrate is purely additive.

### 8.3 Quest engine bridge

**What the quest engine asks.** Per `arc.md` §4 architectural discipline
("quests refer to systems and data, not hard-coded scene
interactions"), the quest engine should be able to gate steps on
"player has Understood concept X" without inspecting save internals.

**What knowledge state asks of the quest engine.** A new optional
step-gate field, additive to the existing `requiredObservation`:

```
{ requiredKnowledge: { id: 'concept:torque', state: 'understood' } }
```

When the field is present, the step advances only if
`hasState(id, state)` returns true. The existing `requiredObservation`
remains supported and is the primary gate today; `requiredKnowledge`
is opt-in for new quest authoring.

**What knowledge state guarantees the quest engine.**
- `quest.completed` event → for each `teaches: conceptId[]` on the
  quest, `markUnderstood('concept:<id>')`.
- The cascade unlocks named in `data/knowledgeConcepts.js`
  (`prerequisiteFor`) fire as the existing `unlockConcept` does — no
  regression in behavior. The current `knowledgeSystem.js` cascade
  semantics are preserved (§9).

**Exchange format.** Quest engine reads the substrate via `hasState`
and writes via emitting `quest.completed`. No new shared state.

### 8.4 Materials lab bridge

**What materials lab asks.** "Has the player Understood
`stress_strain` so I can offer the fatigue-test workflow?" — currently
read indirectly via `state.knowledge.unlocked.includes('stress_strain')`.

**What knowledge state asks.** UTM tests emit
`materialsLab.test.completed` events with the material id and a
`teaches` concept id field.

**What knowledge state guarantees.**
- `material:<materialId>` Seen / Interacted / Understood progression
  per UTM usage.
- `concept:<id>` Interacted on each test; Understood per the open
  policy (§13.3) or per the explicit quest unlock.

### 8.5 Cross-cutting consistency rules

These match the cross-consistency requirements established by the
ecology / biology dispatches:

1. **Single state authority.** The substrate is the single writer of
   `state.knowledge`. Sibling substrates do not write to it.
2. **No species/recipe id duplication.** Knowledge state uses the
   sibling substrates' canonical ids — `species:<id>` from ecology,
   `recipe:<id>` from biology, `material:<id>` from materials lab.
3. **No event surface duplication.** Knowledge state emits
   `knowledge.*` events only. It does not re-emit `ecology.*`,
   `biology.*`, or `quest.*` events.
4. **Save state separation.** The substrate owns
   `state.knowledge.entries[]` and `state.knowledge.audit[]` (§9).
   `state.observations`, `state.completedQuests`, `state.inventory`
   are unowned by knowledge state — they remain canonical for their
   respective owners.
5. **Cascade authority.** Concept-cascade (today in
   `knowledgeSystem.js`) belongs to this substrate; sibling substrates
   may listen but do not implement parallel cascade logic.
6. **Cross-cutting open questions.** Both sibling docs flag knowledge
   state integration; this doc is the consolidated home of the
   resolution.

---

## 9. Save state model

### 9.1 What persists

The substrate persists to `state.knowledge` per `saveSystem.js`
existing default. The current shape (per
`knowledgeSystem.js` `defaultKnowledge()`):

```
state.knowledge = {
  unlocked: [],       // concept IDs in the Understood state today
  discoveries: [],    // { conceptId, unlockedAt, source }
}
```

The substrate **upgrades** this shape additively to:

```
state.knowledge = {
  // Legacy (preserved for backward compatibility — quests still read `unlocked`):
  unlocked: [],       // = ids in Understood state for domain 'concept'
  discoveries: [],    // = audit entries for Understood transitions in domain 'concept'

  // New (substrate-owned):
  entries: {          // { [id]: { state, firstSeenAt, firstInteractedAt, firstUnderstoodAt, sources, regionScope, confidence } }
    'concept:torque': { state: 'understood', ..., sources: { understood: 'quest:chain_repair' } },
    'species:mesquite': { state: 'interacted', ..., sources: { ... } },
  },
  audit: [],          // append-only transition log: { id, fromState, toState, source, timestamp }
  schemaVersion: 1,
}
```

`unlocked` and `discoveries` continue to be written for legacy
consumers (today: `getErrorExplanation`, journal renderers). They are
**derived views** of the new `entries` structure, materialized on
write so legacy reads see consistent data without code changes. This is
the additive-extension pattern from `biology-substrate.md` §3.

### 9.2 Migration from current implicit tracking

`saveSystem.js` adds a `migrateV6toV7` step (or whatever the next
version is at implementation time):

1. Scan `state.observations[]` for known species ids → mark Seen for
   `species:<id>`.
2. Scan `state.observations[]` for known recipe-outcome flags
   (`'dna_extracted'`, `'composite_created'`, etc.) → mark Interacted
   on the corresponding `recipe:<id>`.
3. Scan `state.completedQuests[]`. For each quest in
   `data/quests.js` with a `teaches: conceptId[]` field (new field,
   additive), mark Understood for those concepts.
4. Scan `state.inventory[]` → mark Seen for each `item:<id>`.
5. Scan `state.knowledge.unlocked[]` → mark Understood for each
   `concept:<id>` (no behavioral change; just routes through the new
   API path).
6. Set `schemaVersion: 1`.

The migration is **idempotent**: running it twice produces identical
output. The migration is **lossless**: any data not yet representable
in the new shape is preserved in `state.observations` /
`state.completedQuests` / `state.inventory` for legacy reads.

### 9.3 Backward compatibility

- The legacy `knowledgeSystem.js` API
  (`unlockConcept`, `processEvent`, `isConceptUnlocked`,
  `checkPrerequisites`, `getUnlockedConcepts`,
  `getDiscoverableConcepts`, `getErrorExplanation`,
  `getKnowledgeProgress`) is preserved as a thin shim over
  `markUnderstood` / `hasUnderstood` / `queryKnowledge`. Existing
  callers do not change.
- `state.observations` continues to be the primary read for quest
  step gating until quests opt into `requiredKnowledge` (§8.3).
- `state.completedQuests` continues to be the canonical quest
  bookkeeping store.
- Saves predating the substrate load and migrate cleanly; the migration
  step does not require the player to re-run anything.

### 9.4 What does not persist

- Subscription registrations (re-attached on substrate init).
- Cross-references / `relatedEntries` (re-derived from data tables on
  load).
- UI flash-toast state ("you just learned about torque!").

---

## 10. Performance and lifecycle

### 10.1 Per-frame cost

Zero. The substrate has no `update()` hook. Transitions are
event-driven; queries are O(1) hash lookups for `hasState` and
O(entries) for `queryKnowledge`.

### 10.2 Memory cost over a long playthrough

Bounded. An upper-bound estimate: each KnowledgeEntry is ~200 bytes
(state + 3 timestamps + sources + region scope + cached metadata).
Across all domains, an Act-3 endgame has ≤ 2,000 entries (all species
seen, all recipes interacted, all concepts understood, all language
terms encountered, all NPCs met, all locations entered) → ≈ 400 KB.
The audit log grows linearly with transitions and is bounded by
`audit.maxLength` (proposed default: 5,000 entries; older entries
folded into the timestamps and dropped). Total budget: ≤ 1 MB save
contribution at endgame.

### 10.3 Cleanup on scene shutdown / restart

The substrate is **not scene-attached** per `arc.md` §4 Portability
Principle. It does NOT clean up on scene shutdown:
- Subscriptions on the global event bus persist.
- `state.knowledge` persists.
- A scene's local UI overlay (journal flash, knowledge tooltip) is
  scene-side and is cleaned by the scene itself.

On a "New Game" reset (per `saveSystem.js` `resetGame`), the substrate
re-initializes from the default `state.knowledge` shape.

### 10.4 HMR

`state.knowledge` survives HMR (it is part of save). Subscriptions
re-bind on substrate re-init.

### 10.5 Bridge cost

The substrate is a passive listener on the global event bus. Each
upstream event triggers at most one transition + one event emission.
The cost of emitting `knowledge.state.change` is the same as any other
Phaser event emission; subscribers pay their own callback cost.

---

## 11. Discipline rules

Non-negotiable per `arc.md` §4 and §8:

1. **No scene imports inside `systems/knowledgeState/`.** Verified by
   review and by `data-schema-keeper`-style audit.
2. **No direct quest-state mutation.** The substrate writes only to
   `state.knowledge`. It never writes to `state.completedQuests`,
   `state.observations`, `state.inventory`, or any sibling-substrate
   state. It never calls `questSystem.advance()`.
3. **All knowledge entries are data-driven.** Adding a new
   knowledge entry is a `data/` table addition (typically already
   covered by an existing per-domain table — `data/flora.js`,
   `data/recipes.js`, `data/knowledgeConcepts.js` — plus a row in
   `data/knowledgeDomains.js` if a new domain is introduced). Never a
   code change in the substrate to add an entry.
4. **New domains are data additions, not code changes.** Per §7.2 the
   `data/knowledgeDomains.js` registration declares triggers
   declaratively. The substrate routes them generically.
5. **Knowledge entries are append-only at the audit-log level.** The
   `audit[]` array never has entries removed (only folded when length
   exceeds the cap). The `entries[id]` map can be updated in place
   (state transitions) but entries are never deleted. Forgetting
   semantics (§13.4) are the only proposed deviation, and they preserve
   the audit log even if state regresses.
6. **No knowledge-state-from-knowledge-state cycles.** Cascade unlocks
   fire from prerequisite Understood → dependent Understood, but
   cascades are computed in a single pass and re-firing the cascade on
   the same input is a no-op.
7. **No biome / terrain / discovery duplication.** Per `arc.md` §8.6,
   the substrate does NOT cache biome strings, terrain types, or
   discovery state. It reads them through their canonical APIs only,
   and only as annotations on entry metadata.
8. **No conflation with discovery state.** Per `arc.md` §8.5,
   conflating geographic discovery with conceptual knowledge is a
   halt-and-surface violation. The substrate's API surface
   (`hasState` / `hasUnderstood`) is intentionally distinct from
   `isDiscovered`.
9. **Cultural representation rule** per `arc.md` §2. The data shape
   supports `cultural:<id>` entries; **entries themselves require a
   human-authored design brief**. No agent dispatch authors a
   cultural entry without an explicit brief.
10. **Layer, do not replace.** The substrate layers on top of
    `state.observations`, `state.completedQuests`, and
    `state.inventory`; it does not replace them. Quests, items, and
    observations remain canonical for their respective concerns.

---

## 12. Out of scope for this document

- **Knowledge state UI rendering.** Knowledge journal screens, error
  explanation overlays, "new in journal" toasts, the field-guide /
  encyclopedia surface — all are scene-side or HUD-side concerns. The
  substrate exposes `queryKnowledge` and emits events; UI builds on top.
- **Specific knowledge entries for any domain.** Authoring `species:*`,
  `recipe:*`, `concept:*`, `landmark:*`, `npc:*` content is owned by the
  per-domain data files. The substrate's job is the runtime model, not
  the entry catalogue.
- **Cultural-specific knowledge entries.** Per `arc.md` §2, cultural,
  indigenous, religious, or marginalized cultural content requires a
  human-authored design brief specific to the culture and context. The
  substrate's data shape supports `cultural:<id>` entries; entries
  themselves are out-of-scope for this document and for any agent
  dispatch lacking a brief.
- **Multiplayer knowledge sharing.** Per `arc.md` §7 (Out of Scope —
  multiplayer / online co-op). Per-player knowledge is fully local;
  cross-player synchronization is not a substrate concern.
- **Cross-pillar knowledge integration.** The "videos watched outside
  the game count toward in-game knowledge" possibility named in
  `arc.md` Context is explicitly out-of-scope per Context. The
  substrate does not preclude it (the data shape would accept entries
  authored by the browser pillar) but does not implement it.
- **Real-time pacing of knowledge unlocks.** Cooldowns,
  rate-limiting, anti-grind heuristics — out of scope. Knowledge is
  awarded on triggers; the trigger sources govern pacing.
- **Quiz / assessment authoring.** Quizzes live in `data/quests.js`
  (today) or a future quiz-authoring system. The substrate consumes
  quiz outcomes as Interacted transitions but does not own quiz
  content.
- **Localization of knowledge entry labels.** Per `arc.md` §5,
  language is gameplay; the substrate stores ids and timestamps. UI
  display of the entry label is the renderer's job, with localization
  handled by the existing language system.

---

## 13. Open questions for resolution before implementation

These do not block this design document. They DO need resolution before
the implementation dispatch ships. Each question lists options and a
proposed default; the user decides.

### 13.1 Replace or layer?

**Question.** Should the Knowledge State substrate replace
`state.observations` entirely, or layer on top?

- **Option A (replace).** Migrate all quest gating to
  `requiredKnowledge`. Delete `state.observations`. Cleaner long-term;
  one source of truth.
- **Option B (layer).** Keep `state.observations` as the low-level
  event log; the substrate listens and derives. Quests progressively
  opt into `requiredKnowledge`; the rest continue to use
  `requiredObservation`.
- **Proposed default:** **B**. Per the dispatch's "respect existing
  data structures" rule and per the migration risk of touching every
  quest definition. `state.observations` becomes the audit-log surface;
  knowledge state is the typed read model. **Decision blocks
  implementation.**

### 13.2 Entry granularity

**Question.** How granular should knowledge entries be?

- **Coarse:** one entry per high-level concept (`concept:torque`).
- **Medium:** one entry per concept-in-context (`concept:torque@bike`,
  `concept:torque@spacecraft`). Captures Universal-Testing-Machine
  transfer.
- **Fine:** one entry per specific instance (`concept:torque@chain_repair_quest`).
- **Proposed default:** **Coarse** for `concept:*`, **medium** for
  cross-act concepts where transfer is the curriculum (`concept:dose_response`
  may want `@medicine`, `@chemistry`, `@ecology`, `@terraforming`
  variants whose Understood-state is independent). Fine granularity is
  rejected — explodes the entry count without curriculum benefit.
  **Decision affects data authoring; non-blocking for substrate
  implementation.**

### 13.3 Confidence / mastery beyond Seen / Interacted / Understood

**Question.** Should knowledge entries have a confidence or mastery
level beyond the three states? Per `arc.md` §1 the curriculum
distinguishes "I know it" from "I can apply it reliably" — the latter
might benefit from a mastery score.

- **Option A (binary).** Three states only. Understood is binary.
- **Option B (mastery score).** Add a `confidence: 0..1` field that
  rises with successful applications and may decay (§13.4). Used by
  hint system: "your Understood torque is 0.6 — here's a hint about
  gear ratios."
- **Option C (count-based).** Track `successCount` and
  `failureCount`; UI computes confidence from the ratio.
- **Proposed default:** **A for v1**, **C for v2** (ship binary first;
  add counts when there is a use case). The data shape supports `null`
  confidence so it is not a breaking change. **Non-blocking for
  implementation.**

### 13.4 Forgetting

**Question.** How does forgetting work? Per `arc.md` §1 (cognitive
ecology in the curriculum) and the existing `digital_amnesia` concept
in `knowledgeConcepts.js`, forgetting is on-curriculum — but the
substrate's discipline rule §11.5 says entries are append-only.

- **Option A (no forgetting).** Once Understood, always Understood.
  Append-only audit, monotonic state. Simplest.
- **Option B (decay on disuse).** Long unused → state regresses
  Understood → Interacted, Interacted → Seen. Audit log preserved.
  Curriculum-on for cognitive ecology lessons.
- **Option C (selective forgetting via gameplay event).** A
  game event ("you slept poorly", "you switched tools") triggers a
  one-shot regression on a domain. Specific to scripted moments.
- **Proposed default:** **A for v1**. Forgetting is a Real Game
  Mechanic decision per `arc.md` §6 — surface as an open question for
  human design, not as a default. **Decision is non-blocking for v1.**

### 13.5 Wrong / corrected knowledge

**Question.** Does the player ever learn something WRONG, with a
later correction? E.g., the player might "Understand" that all desert
plants are safe to forage, then learn (via a poisoning event) that they
were wrong.

- **Option A (correction model).** Add a `correctedAt` field that
  records "this was wrong; here's the correction." The Understood
  state is replaced by a new entry id (`concept:dose_response.v2`).
  Audit log preserves the misunderstanding for journal review.
- **Option B (no correction).** Knowledge entries represent the
  current best understanding. A correction simply overwrites the
  state's `sources` field with a "via correction" tag.
- **Option C (no wrong-knowledge model).** The game does not surface
  "you were wrong"; corrections are part of normal Interacted →
  Understood progression, not a special case.
- **Proposed default:** **B**. Curriculum value is high; complexity is
  manageable. **Decision affects data authoring; non-blocking for
  substrate implementation.**

### 13.6 Region-specific or universal knowledge?

**Question.** Should knowledge be region-specific or universal? Some
concepts (`concept:dose_response`) are universal; some
(`language.term:sw.karibu`) are intrinsically regional; some
(`recipe:turquoise_inlay`) are regionally-anchored but
universally-applicable once learned.

- **Option A (universal by default).** All entries default
  `regionScope: 'universal'`. Region-specific entries opt in.
- **Option B (region-scoped by default for cultural / language /
  region-specific recipes).** The data table declares scope per
  domain.
- **Proposed default:** **B**, with the per-domain registration in
  `data/knowledgeDomains.js` declaring `defaultRegionScope`. Concepts
  are universal by default; language terms are scoped by default;
  recipes are universal by default unless authored cultural-anchored.
  **Decision blocks data authoring for Act 2; non-blocking for v1
  implementation if Act 1 only ships.**

### 13.7 Per-domain or unified data file?

**Question.** Should each domain have its own knowledge data file
(one per `species`, `recipe`, `concept`, etc.), or a unified
`data/knowledge.js`?

- **Option A (per-domain).** Today's pattern — entries live in their
  per-domain files; the substrate derives ids.
- **Option B (unified).** One big `data/knowledge.js` with all
  entries. Single source of truth, but duplicates per-domain content.
- **Proposed default:** **A**. The substrate reads the per-domain
  tables (`data/flora.js`, `data/recipes.js`,
  `data/knowledgeConcepts.js`, etc.) plus a small registry
  (`data/knowledgeDomains.js`). No duplication. **Decision blocks data
  authoring; proposed default applies to implementation.**

### 13.8 Stage 3 biology engineered-organism knowledge

**Question.** Does the Stage 3 biology workbench produce knowledge
entries about engineered organisms? Per `biology-substrate.md` §3.1
Stage 3 Organisms have an `ecosystemBehavior` field; they are
biology-owned, not ecology-owned.

- **Option A (yes — `species:engineered.<id>` entries).** Each designed
  organism produces a knowledge entry. The player accumulates
  Understood-state on their own designs.
- **Option B (no — biology owns engineered-organism state internally).**
  Engineered organisms are visible only in `state.biology.organisms`;
  the substrate sees `concept:organism_engineering` Understood, not
  individual organism entries.
- **Proposed default:** **A**. Maximum curriculum value; aligns with
  the Universal Testing Machine pattern (each design is a tested
  artifact). **Decision blocks Stage-3 implementation; non-blocking
  for v1 substrate.**

### 13.9 Cultural representation encoding in the data structure

**Question.** Per `arc.md` §2, decisions about specific indigenous,
religious, or marginalized cultural content require explicit human
design input. How should this rule be encoded in the data structure
itself, so an agent dispatch can detect a cultural entry and refuse
to author it without a brief?

- **Option A (sentinel domain).** Reserve `cultural:*` as a domain
  whose entries can only be added via a registered "design brief"
  attestation; the substrate refuses untagged additions to this domain
  in dev mode.
- **Option B (per-entry flag).** Add a `requiresDesignBrief: true`
  flag to any entry; the substrate logs but does not block runtime
  consumption (the gating happens at authoring / review time, not
  runtime).
- **Option C (orchestration-only).** No data-structure encoding; the
  rule lives in agent prompts and human review.
- **Proposed default:** **A + B** combined. `cultural:*` domain
  entries MUST also carry `requiresDesignBrief: true`; the substrate's
  dev-mode load refuses untagged additions to `cultural:*`. Production
  load logs and continues. The runtime model is permissive; the
  authoring path is gated. **Decision blocks Act-2 cultural-content
  authoring; non-blocking for v1 (Act-1) substrate implementation.**

### 13.10 Cross-cutting open questions (knowledge × ecology × biology × world model)

- **Knowledge state ↔ ecology bridge.** Currently
  `ecology-substrate.md` §6 says "Knowledge state — NOT consumed and
  NOT updated." Once this substrate ships, the contract upgrades to
  "ecology emits, knowledge state listens." Both docs update in the
  same commit per cross-doc drift resolution. **Decision: this
  substrate's implementation must coincide with the
  `ecology-substrate.md` v2 amendment.**
- **Knowledge state ↔ biology bridge.** `biology-substrate.md` §5
  reserves the `knowledge.state.unlocked` event name; this doc emits
  `knowledge.state.change`. Either both docs adopt
  `knowledge.state.change` or both adopt `knowledge.state.unlocked`.
  **Proposed default:** `knowledge.state.change` (this doc's name) is
  more general. **Decision affects biology-substrate.md v2.**
- **Knowledge state ↔ navigation paradigm.** `navigation-substrate.md`
  (per `.claude/plans/items-1-8-playbook-2026-04-27.md` §A.7 reframe)
  is also unbuilt. Knowledge state's `landmark:*` and `location:*`
  domains have a soft dependency on the navigation substrate's
  decisions about what counts as "entered" a landmark. **Non-blocking
  for v1**: the substrate uses today's `region.discovered` events.
- **Knowledge state ↔ recipe-system unification (`A.10`).** The
  `data/recipes.js` table currently mixes biology, crafting, and
  chemistry recipes. The substrate's `recipe:*` domain inherits
  whatever ids that table commits. **Non-blocking** but flagged for
  review.
- **Knowledge state ↔ asset pipeline.** Visual tokens for the
  knowledge journal UI (concept icons, etc.) are sourced from the
  per-domain data tables. Asset import is a separate dispatch per
  `arc.md` §7.

---

## Cross-document drift resolution

This document introduces a substrate that two sibling documents
(`ecology-substrate.md`, `biology-substrate.md`) reference but pre-date.
When this substrate's implementation lands, the following amendments
fire in the same commit:

1. **`ecology-substrate.md` §6.** Update "Knowledge state — NOT
   consumed and NOT updated until `knowledge-state-substrate.md` lands"
   → "Knowledge state — listened to via `knowledge.state.change` for
   future quest gating; ecology continues to write `state.observations`
   and the knowledge state substrate derives Seen / Interacted from
   observation / forage events."
2. **`biology-substrate.md` §5 and §6.** Update "knowledge state — NOT
   consumed and NOT updated until `knowledge-state-substrate.md` lands"
   → "subscribes to `knowledge.state.change` for advanced-recipe and
   advanced-stage gating; emits `biology.recipe.outcome` etc. that the
   substrate routes to concept Understood transitions per their
   `teaches` declarations."
3. **`arc.md` §8.5.** Update "NO system may consume knowledge-state
   queries before that design doc lands" → "The substrate at
   `src/renderer/game/systems/knowledgeState/` is the canonical
   consumer surface; quests, recipes, and dialog gate on
   `hasState(id, state)`."

Until that implementation commit lands, this document is design-only
and the §8.5 gating clause remains in force.
