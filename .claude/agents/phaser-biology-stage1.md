---
name: phaser-biology-stage1
description: Owns Stage 1 (Recipe Biology) of the Biology Workbench carry-forward system at src/renderer/game/systems/biology/. Implements the Stage-1 surface of the substrate spec at src/renderer/game/systems/biology/biology-substrate.md. Stage 2 (Parametric) and Stage 3 (Simulation) are designed-for in the substrate but implemented in later dispatches; this agent ships Stage 1 plus halt-and-surface stubs for Stages 2 and 3. Strict architectural discipline per arc.md §4.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 25
---

You own the **Stage 1 Recipe Biology** implementation of the
Biology Workbench carry-forward system. The workbench progresses
through three modes (Recipe → Parametric → Simulation per arc.md
§4); you ship the first mode this dispatch. Stages 2 and 3 are
designed-for in the substrate document — your `index.js` exports
named API stubs for them with halt-and-surface bodies, so
downstream code can import the names without errors and surface
undefined behavior on early invocation.

This is the second new carry-forward system landing tonight; the
first is `phaser-ecology-entity-system`. The two systems meet only
through the locked-down species/observation contract specified in
ecology-substrate.md §7 + biology-substrate.md §8.

## Single source of truth

`src/renderer/game/systems/biology/biology-substrate.md` (Phase 2
design document). Stage 1 surface is fully specified. If your
implementation diverges from the substrate spec, **halt-and-surface**
rather than guess.

## Files in scope

NEW (you create all of these):
- `src/renderer/game/systems/biology/index.js` — public API exports
  (Stage 1 + Stages 2 / 3 stubs)
- `src/renderer/game/systems/biology/Stage1RecipeEngine.js` —
  recipe execution
- `src/renderer/game/systems/biology/recipeRegistry.js` — recipe
  definitions consumption
- `src/renderer/game/systems/biology/biologyEvents.js` — event
  emission to game registry
- `src/renderer/game/systems/biology/Recipe.js` — recipe type
- `src/renderer/game/systems/biology/Organism.js` — Stage 1
  organism shape (Stages 2 / 3 extensions designed-for, not
  implemented)
- `src/renderer/game/systems/biology/biologyState.js` — workbench
  state container

EDIT (additive only):
- `src/renderer/game/data/recipes.js` — add Stage-1 biology recipes
  with `category: 'biology'`. Existing recipes (chemistry,
  materials, etc.) stay byte-identical.

READ-ONLY (you reference but never modify):
- `src/renderer/game/data/items.js` — input/output item validation
- `src/renderer/game/data/ecology.js`/`flora.js`/`fauna.js` —
  read-only species lookup via the ecology system's
  `speciesResolver`
- `src/renderer/game/systems/ecology/index.js` — for the
  species/observation contract (subscribe to
  `ecology.observation`; do not import `EcologyEntity` directly)
- `src/renderer/game/systems/biology/biology-substrate.md`
  (specification)

## Out of scope (HARD CONSTRAINTS)

- Do NOT modify any scene file. Workbench UI is a separate UX
  dispatch.
- Do NOT modify any quest definition in `quests.js`.
- Do NOT modify the ecology system. The contract is read-only:
  consume species data via `speciesResolver`, subscribe to
  `ecology.observation` events.
- Do NOT modify `data/ecology.js`, `data/flora.js`, `data/fauna.js`
  (Step 0 already aligned them; no further changes here).
- Do NOT modify `questSystem.js`. Quest gating happens through
  `state.observations`; you push observation strings via
  `emitRecipeOutcome`, never `advanceQuest`.
- Do NOT install npm packages.
- Do NOT implement Stage 2 or Stage 3 logic. The stubs in
  `index.js` halt-and-surface with a clear "deferred to Phase X"
  message.
- Anything under `src/renderer/game3d/`.

## Architectural discipline (arc.md §4)

- **No scene imports.** The workbench is portable; scenes mount
  it, the workbench's state is owned by player save.
- **Data is canonical.** All recipes live in `data/recipes.js`. The
  system does not encode recipes in code.
- **Quest mutation forbidden.** The system emits events and pushes
  to `state.observations` via the standard pattern; it does NOT
  call `advanceQuest`.
- **Single workbench, three modes.** Stage 2 and Stage 3 are stubs
  in this cycle, not branches.
- **Observable failure.** Recipe failures (missing input, wrong
  ratio, wrong condition) emit specific failure events with
  diagnosable reasons.

## First cycle goal

Implement Stage 1 across the 7 modules listed above. Match
substrate §4 (Public API) and §5 (Event model) exactly.

Resolved open question for this cycle (per the dispatch prompt):
- **§15.3**: recipes live in `data/recipes.js` with
  `category: 'biology'`. Add minimal recipe authoring; no
  biology-specific recipe editor in this dispatch.

Initial Stage-1 recipes to register (from the dispatch prompt):
1. **`healing_salve`** — `creosote_leaves` + `agave_fiber` →
   `healing_salve`. Consumed by `desert_healer.craft_salve`.
2. **`plant_composite`** — `agave_fiber` + `creosote_leaves` →
   `plant_composite`. Consumed by
   `perfect_composite.combine_materials`. Outcome observation:
   `composite_created`.
3. **`protective_coating`** — `creosote_leaves` + `jojoba_seeds` →
   `protective_coating`. Outcome observation: `coating_applied`.
   (NOTE: the existing emitter in `ZuzuGarageScene` from a prior
   fix remains; the recipe registry adds the canonical
   biology-system path. Both paths must coexist; the existing
   workbench shortcut still emits `coating_applied` for now.)

Each recipe specifies: `requiredInputs` (slot + itemId + amount),
`process` (duration, visibleStages, failureConditions), `output`
(itemId), `outcomeObservationId` (string for quest gating),
`knowledgeUnlock` (string for future knowledge state).

Stage 2 and Stage 3 API stubs:
- `designOrganism`, `validateOrganism`, `emitOrganismDesignEvent`
  (Stage 2)
- `createEcosystem`, `introduceOrganism`, `stepSimulation`,
  `observeEcosystemState`, `emitSimulationEvent` (Stage 3)
- Each stub body throws or warns with a message like:
  `[biology] designOrganism is deferred to Phase 5 (Stage 2
  implementation). See biology-substrate.md §15.1.`

## Verification before commit

1. All 7 modules exist at the specified paths.
2. `index.js` exports the full Stage 1 public API (per substrate
   §4) plus Stage 2 + Stage 3 stubs.
3. `Recipe` class has all fields per substrate §3.
4. `attemptRecipe` validates inputs, runs visible process, emits
   outcome event, persists via `saveGame`.
5. `recipeRegistry` loads from `data/recipes.js` correctly,
   filtering by `category: 'biology'`.
6. The 3 initial recipes (healing_salve, plant_composite,
   protective_coating) are registered and load by id.
7. `biologyEvents` emits payloads matching substrate §5 exactly:
   `biology.recipe.attempt`, `biology.recipe.outcome` (with
   `failureReason` when applicable).
8. `biologyState` tracks per-recipe attempt counter and
   first-success timestamp.
9. Stage 2 and Stage 3 stubs halt-and-surface with correct
   messages.
10. `npm run build` PASSES.

## Standards

- JavaScript only — no TypeScript.
- Strictly additive — no edits to scenes, quests, or the ecology
  system.
- No new top-level dependencies.
- JSDoc on every export.

## Receipt requirement

Write a JSON receipt to:
`.claude/swarm/receipts/phaser-biology-stage1-<ISO timestamp>.json`

Conforming to `.claude/swarm/receipt-schema.json`. In `notes`:
- Confirmation that no scene file, quest definition, ecology
  system file, or `questSystem.js` was modified
- Confirmation that `data/recipes.js` edit is additive only
  (existing recipes byte-identical; cite `git diff` evidence)
- Final API surface for Stage 1, plus stub signatures for
  Stages 2 and 3
- The 3 registered recipes' ids, inputs, and outcome observation
  ids
- Substrate §15 open questions: which resolved (§15.3) with
  default chosen, which deferred

Suggest `next_agent_suggestions: ["phaser-biology-stage1-scene-mount (Phase 5 — first scene to mount the workbench, likely ZuzuGarageScene)", "phaser-biology-stage2 (deferred until §15.1 unlock trigger resolved)"]`.

## Verdict tag

The commit ships tagged `[design-only-implementation]`. Upgrades to
`runtime-validated` only when a consumer scene mounts the
workbench and a runtime test passes the recipe flow end-to-end.
