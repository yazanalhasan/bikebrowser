---
name: phaser-lab-notebook-pipeline
description: Closes the density-side gap of the bridge_collapse quest. Adds an interactive scale, fixed-volume coupon, and density chalkboard inside MaterialLabScene; persists each measurement to a new state.materialLog; renders a structured Materials-Lab entry in Zuzu's Notebook; and rewires Mr. Chen's quiz_weight dialog to interpolate the player's actual measurements instead of canonical 0.83/8.9/7.8 g/cm³ literals. Tightly-coupled three-subsystem agent — schema, scene, quest data must ship together or the loop breaks.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 30
---

You own the density-measurement pipeline that closes the gap left by the
UTM tensile-test work (commit `utm-material-lab-vertical-slice` +
`lab-rig-system-utm-migration`). The strength/failure side is shipped;
the weighing/density side is still pre-canned text. Your job is to make
density data come from the player's actions and land in three places at
once: the lab, the save schema, and Mr. Chen's dialog.

## Required reading before you start

1. `src/renderer/game/scenes/MaterialLabScene.js` — the current scene
   is a thin LabRigBase subclass after the UTM migration. Note the
   `drawApparatus`, `getSampleSet`, `runSampleTest`, and door-back-to-
   garage exit at (60, 130). Your new instruments mount in the empty
   left bay — don't touch the rig, the chart, or the material selector.
2. `src/renderer/game/scenes/LabRigBase.js` — note the chart
   layout constants (`CHART_X / CHART_Y / CHART_W / CHART_H`) and the
   `getChartConfig` / `getChartAnnotations` extension hooks. You will
   add a small chart-mode toggle on top of these (see Subtask 1).
3. `src/renderer/game/systems/materials/materialDatabase.js` — the
   canonical `densityKgM3` per material (mesquite 850, steel 7850,
   copper 8960). Source of truth for the scale's reading; never
   exposed to the player as a literal.
4. `src/renderer/game/systems/saveSystem.js` — find the migration chain
   (`migrateV1ToV2`, `migrateV2ToV3`, `migrateV3ToV4`). Add a
   `migrateV4ToV5` that initializes `materialLog: []`. Bump
   `CURRENT_VERSION` from 4 to 5.
5. `src/renderer/game/GameContainer.jsx` — the React HUD overlay.
   Notebook panel is at lines ~937-947 currently rendering `journal[]`
   strings. You'll extend with a structured-entry dispatcher.
6. `src/renderer/game/data/quests.js` — find `bridge_collapse.steps`
   step `quiz_weight` (lines ~1192-1207). You'll change its `text` to
   a template string that gets interpolated at dialog-emit time.
7. `src/renderer/game/scenes/NeighborhoodScene.js:343-369` —
   `_emitEnrichedDialog`. This is where the template interpolation
   happens before the dialog event fires.

## Files in scope

NEW:
- `src/renderer/game/systems/lab/scaleStation.js` — encapsulates the
  scale + slot UI + record button. Pure Phaser; consumes a callback.
- `src/renderer/game/systems/lab/calipers.js` — fixed-volume coupon
  prop. ~50 LOC.
- `src/renderer/game/systems/lab/densitySlate.js` — chalkboard that
  reads from `state.materialLog`, displays per-material density,
  exposes a "lightest per cm³" auto-fill button.
- `src/renderer/game/systems/lab/densityChart.js` — second chart-mode
  callback that reads `materialLog` + `materialTestsCompleted` and
  renders a 3-bar density-+-strength composite. Plugs into
  LabRigBase's existing `getChartConfig` extension point as a
  toggle, NOT a replacement.
- `src/renderer/game/systems/questTemplating.js` — pure helper:
  `interpolateStepText(text, templateVars, state)`. Resolves
  `{massTable}` and `{densityTable}` tokens from `state.materialLog`.
- `src/renderer/game/components/MaterialLogEntry.jsx` — React
  component for the structured journal entry. 3-column table
  (material / mass / density), inline horizontal density bars, copy-
  to-clipboard button.

EDIT:
- `src/renderer/game/systems/saveSystem.js` — `materialLog`,
  `derivedAnswers`, version bump 4→5, migration.
- `src/renderer/game/scenes/MaterialLabScene.js` — instantiate scale,
  calipers, slate; mount density-chart toggle; pass record-mass
  callback that pushes into `state.materialLog`.
- `src/renderer/game/scenes/LabRigBase.js` — accept an optional
  second chart-config from subclass + a toggle button on the chart
  header that flips between modes. Strictly additive; default
  remains stress-strain.
- `src/renderer/game/data/quests.js` — `quiz_weight` and
  `quiz_strength` steps gain `templateVars: ['massTable']` /
  `templateVars: ['strengthTable']`. Step `text` rewritten as a
  template. CHOICES UNCHANGED. Don't touch any other quest.
- `src/renderer/game/scenes/NeighborhoodScene.js` — call
  `interpolateStepText` before passing `step.text` to the dialog
  event in `_emitEnrichedDialog`.
- `src/renderer/game/GameContainer.jsx` — the Notebook panel's
  `journal.map` becomes a dispatcher that renders strings as before
  AND `{ kind: 'materialLog', ...}` via `MaterialLogEntry`.

## Out of scope

- The UTM rig, stress-strain chart, material selector, splinter/neck/
  stretch animations — DO NOT TOUCH. The strength side is shipped.
- Per-sample variable volumes (calipers stay fixed at 10 cm³ uniform
  coupons; the spec is explicit on this).
- Adding a separate scene for weighing — everything mounts in the
  existing MaterialLabScene's empty left bay.
- Voice-narrating the new instruments — the existing TTS pipeline
  picks up dialog text automatically.
- Achievements / badges — not in this dispatch.

## Subtask 1 — Lab instruments

### Layout (left bay of MaterialLabScene, x ≈ 60–180)

- **Scale**: platform at (110, 360), display at (110, 320). Three
  buttons at (60, 400), (110, 400), (160, 400) for mesquite / steel /
  copper. Each button enables only if the player has the
  corresponding `*_sample` item; otherwise it's grayed.
- **Calipers / coupon**: small transparent beaker at (110, 470).
  Single line text below: "Coupons: 10 cm³ uniform". Click → emits
  a Lab-Notes dialog event ("All three coupons are machined to 10
  cm³. Density = mass ÷ volume.") and sets `state.observations +=
  'volume_known'`.
- **Density slate**: chalkboard at (110, 540). Click → opens an
  in-scene UI panel listing each material the player has measured,
  its mass, and `mass / 10 cm³`. "Lightest per cm³: ___" with an
  auto-fill button driven by `state.materialLog` lowest-density
  entry. Auto-fill writes
  `state.derivedAnswers.lightestMaterial = '<id>'` and sets
  `state.observations += 'densities_calculated'`.

All three instruments mount via `LocalSceneBase.addInteractable({...})`
so they appear in the same interaction-prompt UI as the rest of the
scene.

### Scale interaction

On scale-button click for material `<id>`:
1. Animate the matching sample sprite onto the platform (use a
   simple 240ms tween, no new assets).
2. Display reads `mass: X.XX g` where mass = `densityKgM3 × 10 / 1000`.
   Mesquite: 8.50 g. Steel: 78.50 g. Copper: 89.60 g.
3. After 600ms, a "Record" button appears under the display.
4. On Record: push `{ id, name, massGrams, recordedAt: Date.now() }`
   into `state.materialLog`, save, and replace the Record button
   with a green ✓.
5. Already-measured materials show their stored mass on display (no
   re-record needed) when the player clicks the button.
6. When all 3 masses are recorded, set
   `state.observations += 'masses_measured'`.

### Density chart toggle

Add a small toggle button at the chart header (top-right of
`CHART_X + CHART_W`). States: "Stress / Strain" (default), "Density".

In Density mode (only renders when `state.materialLog` is non-empty):
- 3 vertical bars. X = material id. Y axis = density (g/cm³).
- Bar height = density / 10 (capped). Mesquite: 0.85, Copper: 8.96,
  Steel: 7.85 — visible difference at a glance.
- Bar fill darkness = strength rating (0-100% from
  `materialDatabase.strengthPct` if present, else 50%).
- Bars only drawn for materials in `state.materialLog`; not-yet-
  measured materials show empty outlines with "?" labels.
- Updates live on each Record.

## Subtask 2 — Save schema + Notebook UI

### `saveSystem.js`
- `CURRENT_VERSION`: 4 → 5.
- New default fields on `INITIAL_STATE` (or whatever the default-state
  factory is named — verify with grep):
  - `materialLog: []` — array of `{ id, name, massGrams, recordedAt }`.
  - `derivedAnswers: {}` — `{ lightestMaterial?: string, ... }`.
  - `observations: []` — already exists; vocabulary now includes
    `'masses_measured'`, `'volume_known'`, `'densities_calculated'`.
- Migration `v4 → v5`: initialize `materialLog: []`,
  `derivedAnswers: {}` if absent. Existing `observations` and
  `materialTestsCompleted` stay as-is.
- Add a small Node test `scripts/test-lab-notebook-migration.js`
  that loads a v4 save fixture, runs the migration, asserts new
  fields exist, asserts version bumped. Same pattern as existing
  migration tests in this repo if any exist; otherwise plain
  `node` script printing PASS/FAIL.

### Journal entry shape
- Existing `state.journal: any[]` accepts strings (legacy) and
  structured entries.
- New shape: `{ kind: 'materialLog', label: 'Materials Test Lab —
  <ISO date>', rows: [...], capturedAt: <ms> }`.

### Notebook UI dispatcher (`GameContainer.jsx`)
Replace the current `journal.map((entry, i) => <div ...>{entry}</div>)`
with:

```jsx
{journal.map((entry, i) =>
  typeof entry === 'string'
    ? <div key={i} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">{entry}</div>
    : entry?.kind === 'materialLog'
    ? <MaterialLogEntry key={i} data={entry} />
    : null
)}
```

`MaterialLogEntry` (NEW):
- Displays the label.
- 3-column table: Material, Mass (g), Density (g/cm³).
- Density column has a tiny inline bar (CSS `flex` width %, max width
  taken from the largest density in this entry).
- "📋 Copy" button → puts a tab-separated text version on the
  clipboard for parents/teachers to paste into a worksheet.
- No dependencies — pure CSS / `navigator.clipboard.writeText`.

### Mr. Chen hand-off polish in MaterialLabScene
The current `_emitTestCompletedIfQuestActive` (LabRigBase's
`_emitCompletionDialog`, actually — verify with grep) closes the load-
test moment with "Strength alone isn't enough — it's strength per
weight that matters for a bridge." Append:

> "Take the data back to Mr. Chen — he'll want to see the numbers."

AND in the same `onClose` (or via a new `onAdvance` hook), append a
structured journal entry `{ kind: 'materialLog', label: 'Materials
Test Lab — <ISO date>', rows: [...state.materialLog],
capturedAt: Date.now() }` so the player can re-read it later in the
notebook. Idempotent: don't append twice if the player re-runs the
load test.

## Subtask 3 — Quest data + Mr. Chen interpolation

### `data/quests.js`
- `bridge_collapse.steps[8]` (`quiz_weight`):
  - Replace `text` static value with template string:
    `'You weighed each sample. {massTable}\\n\\nWhich is lightest per cm³?'`
  - Add `templateVars: ['massTable']`.
  - Choices unchanged in shape; verify each choice has the same
    `correct: true/false` flags.

- `bridge_collapse.steps[11]` (`quiz_strength`):
  - Template: `'Load test results: {strengthTable}.\\n\\nWhich holds up best?'`
  - Add `templateVars: ['strengthTable']`.
  - Choices unchanged.

- `quiz_choice` (final) — leave text unchanged (it's a synthesis
  question; not a measurement-readback).

### `systems/questTemplating.js` (NEW)

```js
export function interpolateStepText(text, templateVars, state) {
  if (!Array.isArray(templateVars) || templateVars.length === 0) return text;
  let out = text;
  if (templateVars.includes('massTable')) {
    const rows = (state.materialLog || []).map(r => `  ${r.name}: ${r.massGrams.toFixed(2)} g (${(r.massGrams / 10).toFixed(2)} g/cm³)`).join('\\n');
    out = out.replace('{massTable}', rows || '  (no measurements yet)');
  }
  if (templateVars.includes('strengthTable')) {
    const completed = state.materialTestsCompleted || [];
    const rows = completed.map(id => {
      const m = MATERIALS[id];
      return `  ${m?.name || id}: ${m?.strengthPct ?? '—'}%`;
    }).join('\\n');
    out = out.replace('{strengthTable}', rows || '  (no tests yet)');
  }
  return out;
}
```

(Import `MATERIALS` from `materialDatabase.js`.) Pure function; can
be unit-tested with plain Node.

### `NeighborhoodScene._emitEnrichedDialog`

Right before the dialog event is set, interpolate:

```js
const immediateText = step.templateVars
  ? interpolateStepText(fallback?.captionLine || step.text, step.templateVars, state)
  : (fallback?.captionLine || step.text);
```

Don't touch any other behavior in that function. The interpolation
falls through to literal text if `templateVars` is absent — so all
non-templated quests stay byte-identical.

### Fallback behavior

Players who skipped the lab and walk straight to Mr. Chen at
`quiz_weight`: `state.materialLog` is empty → `interpolateStepText`
returns `'  (no measurements yet)'` in the table slot, AND Mr. Chen's
existing `aiDialogue.fallback?.captionLine` (if set) takes priority
on the AI side. Critically, choices still render (they're driven by
`step.choices`, not text), so the player can still answer with the
canonical mesquite-is-lightest answer — but now the text reads as
"go measure first" rather than handing them the data.

## Standards

- JavaScript (`.js`/`.jsx`), not TypeScript.
- No new dependencies (no chart libraries, no clipboard polyfills —
  use `navigator.clipboard.writeText` directly).
- `questTemplating.js` is pure: no Phaser, no DOM, no global state.
- All new instrument props in MaterialLabScene confined to the left
  bay (x < 200). Don't shift the rig, chart, or selector.
- All new save fields are additive. Old saves load cleanly via the
  v4→v5 migration.
- Reviewer FAILs on:
  - Any change to the UTM rig, stress-strain chart, material selector,
    or failure animations.
  - Any change to a quest other than `bridge_collapse`.
  - Any change to `quiz_choice` step.
  - Direct access to `materialDatabase.densityKgM3` from anywhere
    other than the scale's record-mass callback (the player's view
    must come from `state.materialLog`, not the truth source).

## Acceptance criteria

1. Player walks into MaterialLabScene with all 3 samples in inventory.
2. Player clicks scale → mesquite button → sees 8.50 g → presses Record
   → green ✓ replaces button.
3. `state.materialLog` contains the entry; save survives reload.
4. Player records all 3 → density slate shows 3 entries with
   computed densities; auto-fill button highlights mesquite.
5. Density-mode chart toggle on the chart header → renders 3 bars,
   bar fill darker for materials the player has load-tested.
6. Player runs UTM tests on all 3 → completion dialog now says
   "Take the data back to Mr. Chen" → notebook gains a structured
   "Materials Test Lab — <date>" entry.
7. Player walks to Mr. Chen → at `quiz_weight`, dialog text shows
   the player's actual measurements (e.g. "Mesquite: 8.50 g (0.85
   g/cm³), Steel: 78.50 g (7.85 g/cm³), Copper: 89.60 g (8.96
   g/cm³)"), not canonical 0.83/8.9/7.8.
8. Notebook (📓 button) shows 1 structured entry + any prior
   string entries. "📋 Copy" puts tab-separated text on clipboard.
9. Migration test loads a v4 save, asserts new fields after
   migration, asserts version=5.
10. v4 → v5 → reload round-trip works; no data loss.

## Receipt requirement

Write `.claude/swarm/receipts/phaser-lab-notebook-pipeline-<ISO>.json`
per schema. Include:
- All files created and edited.
- Save version before/after.
- Migration test result.
- Confirmation that the UTM rig, stress-strain chart, and material
  selector were NOT modified (provide grep evidence).
- Confirmation that `quiz_choice` was NOT modified.
- Suggested next agent: none — this completes the
  density-measurement loop. Possible follow-ups (not required):
  per-sample variable volumes, achievements for full-loop completion.
