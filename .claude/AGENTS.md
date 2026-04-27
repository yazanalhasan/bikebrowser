# BikeBrowser swarm agents — complete reference

Generated 2026-04-27. Source of truth: `.claude/agents/*.md`. When adding a
new agent, add it both to `.claude/agents/<name>.md` and to the relevant
section below + an entry in `.claude/swarm/sequencing.yaml`.

Total: **38 files** in `.claude/agents/` (37 worker definitions + the
orchestrator + the `_template`).

---

## Meta / Orchestration

| Agent | What it does |
|---|---|
| **`swarm-orchestrator`** | The orchestrator itself. Reads state.json, picks the next eligible agent, dispatches it, processes the receipt, updates state, commits. Runs as the main session. |
| **`_template`** | Copy-from skeleton for new worker definitions. Not dispatched. |

---

## Quality (always-on or on-demand validators)

| Agent | What it does |
|---|---|
| **`code-quality-reviewer`** | Auto-dispatched after every worker. Reviews the diff against the worker's own declared standards. Verdict: PASS / NEEDS_REVISION / FAIL. Read-only — only writes its own receipt. |
| **`data-schema-keeper`** | Validates state.json, receipts, sequencing.yaml, world-grid.json, save schema against their JSON schemas. Run after any structured-data change. |
| **`runtime-audit-system`** | In-game runtime checker that runs at boot. Validates cross-system invariants (every quest's giver = real NPC, every requiredItem exists, every region has a biome, etc.). Logs to dev console; does NOT block boot. The runtime counterpart to code-quality-reviewer. |
| **`resource-auditor`** | One-shot snapshot of machine resources — Electron process tree (RAM/CPU/handles), GPU utilization, build size, dependency weight, Phaser runtime stats. Read-only; produces a markdown report. |

---

## Engine Foundation (3D R3F)

| Agent | What it does |
|---|---|
| **`scene-architect-3d`** | Owns root `<Canvas>`, lights, sky, fog, env maps. Built three reusable camera presets — `<SideCam>` (Mario), `<AngledCam>` ~30° (JRPG), `<TopCam>` (Zelda 1). |
| **`physics-engine-3d`** | Owns Rapier integration — `<Physics>` wrapper, ground collider, RigidBody patterns, P-key debug toggle. Foundation for bike-physics + edge-detector + interaction zones. |
| **`asset-pipeline-3d`** | Owns `.glb/.gltf` loaders, optional KTX2, asset-manifest schema, `useScreenAssets()` lifecycle hook (loads on screen enter, unloads on exit). Replaces Phaser asset packs. |
| **`input-controller-3d`** | Unified `useInput()` returning normalized `{moveX, moveY, action, cancel, debug, source}`. Keyboard + gamepad + touch joystick stub. Single listener, context-shared. |

---

## Screen-Grid Core (3D R3F — partly human-gated)

| Agent | Gate | What it does |
|---|---|---|
| **`screen-grid-architect`** | 🚦 human gate | Owns the world-grid coordinate system + per-screen schema + lookup helpers (`neighborFor`, `screenAt`, `screenById`). Load-bearing primitive. |
| **`screen-loader`** | — | `<ScreenLoader>` component reads a screen id from grid, fetches manifest, calls useScreenAssets, mounts subtree under Suspense. The runtime spine that turns grid data into rendered geometry. |
| **`edge-detector`** | — | `<ScreenEdges>` component places Rapier sensor colliders at the four edges; `useEdgeCrossing()` hook fires `{direction, target_screen_id}` events. Bridge between physics and the grid loader. |
| **`screen-transition-fx`** | — | DOM overlay (or post-pass) that fades/wipes during a screen-loader swap so the asset-load gap doesn't show as a hard pop. |

---

## Migration (3D ↔ Legacy 2D)

| Agent | Gate | What it does |
|---|---|---|
| **`save-bridge`** | 🚦 human gate | Bridges legacy 2D Phaser save (saveSystem.js v4) to the new 3D screen-grid world. Maps player position, current scene, 3D-only state onto the existing localStorage blob without breaking 2D loads. |

---

## Audio & TTS (Legacy 2D)

| Agent | What it does |
|---|---|
| **`tts-voice-config`** | Owns `CHARACTER_GENDER` registry in npcSpeech.js + voicePreference fields in npcProfiles.js + voiceschanged race fix. Female NPCs get female voices; male NPCs male; Zuzu uses system default. ✅ Shipped. |
| **`tts-dialog-integration`** | Wires voice config into GameContainer.jsx dialog TTS — fixes speaker→npcId mismatch, appends quiz answer choices to the spoken utterance. Strictly scoped to the dialog-TTS effect block. ✅ Shipped (cycle 2). |
| **`audio-compression-pass`** | Scans `.wav` masters; encodes valid `.ogg`/.mp3 siblings via ffmpeg where missing or 0-byte. 128 kbps music / 96 kbps SFX. Pure additive — never deletes a `.wav`. Returns blocker if ffmpeg absent. |
| **`audio-asset-cleanup`** | 🚦 human gate. Triages 32 MB of audio bloat — orphans, draft alt-mixes, `.wav` masters. Archives via `git mv` to `public/audio/_archived/` rather than delete. Depends on audio-compression-pass for safety. |

---

## Resource / Build / Deps Hygiene

| Agent | Gate | What it does |
|---|---|---|
| **`bundle-splitter`** | — | Splits the 2.97 MB GamePage and 1.95 MB Game3DPage chunks via Vite `manualChunks` so phaser, three, @react-three/*, rapier land in vendor chunks. Folds in dynamic-import fix in MCPAIAdapter.js. |
| **`dep-overrides-housekeeping`** | 🚦 human gate | Adds `overrides` block to package.json forcing single three.js version (eliminates duplicate from stats-gl). Runs `npm dedupe`. Touches lockfile — gated. |

---

## World & Discovery (Legacy 2D — terrain + fog of war)

| Agent | What it does |
|---|---|
| **`world-biome-classifier`** | Tags every region in regions.js with a BIOME enum (desert / grassland / water / rock / mountain / urban / unknown). Pure data; foundation for terrain. |
| **`world-terrain-renderer`** | (v2 spec) DELETES the radial fillCircle blobs at WorldMapScene.js:240-280, REPLACES with continuous tile/noise terrain (32 px), strong biome palette, inter-region blending, elevation shading from a deterministic noise heightmap. New `utils/terrainNoise.js` helper. |
| **`world-discovery-state`** | New `systems/discoverySystem.js` — sparse Set-keyed grid, save/load via existing saveSystem (additive). Civ-style fog data. Rendering owned elsewhere. |
| **`world-fog-overlay`** | Renders fog above terrain, below paths/nodes/labels. Solid black for never-seen; `redrawFog()` callable on discovery-state changes. Doesn't block clicks. |
| **`world-node-gating`** | Hides region nodes + paths-between-nodes until both endpoints are discovered. Adds `revealNode(id)` with Back.easeOut tween + optional discover SFX + first-time narrative dialog. |
| **`world-discovery-quests`** | Cross-system glue. New `discoveryUnlocks.js` maps regionId → unlock specs. Wires `onRegionDiscovered` events into existing quest-system `unlockQuest` API. Read-only on quests.js. |
| **`world-path-renderer`** | Replaces straight lines with curved bezier paths colored by biome difficulty (desert tan, mountain dark/rugged). WATER endpoints skipped. |
| **`world-landmarks`** | Sparse procedural sprite scatter — cacti/rocks (desert), scrub (grassland), ridge lines (mountain). ≤80 total, deterministic placement, no asset files. |
| **`world-map-polish`** | Cosmetic final pass — anchors nodes into biome bases, DELETES translucent zone circles, dims inactive labels to 0.7 alpha, adds camera-edge vignette. |

---

## Phaser Layout System (Legacy 2D — data-driven scenes)

| Agent | What it does |
|---|---|
| **`phaser-scene-layout-extractor`** | Reusable. Converts a single Phaser scene from inline pixel literals to a data-driven layout JSON. Strict refactor — pixel-identical output. Touches positions/sizes only; logic byte-identical. Per spec update (2b117a3), also adds `static layoutEditorConfig` opt-in to every refactored scene. |
| **`phaser-editor-opt-in-backfill`** | Adds the 5-LOC `static layoutEditorConfig` to a scene that was extracted BEFORE 2b117a3. Idempotent (no-op if present). Reads layoutAssetKey/layoutPath out of existing `this.load.json()` call. |
| **`phaser-layout-editor-overlay`** | The in-game layout editor itself. Sibling Phaser scene, F2 hotkey-toggled. Reads active scene's layout JSON, renders draggable shapes with name labels, single-select + drag, Save button writes via new POST `/api/save-layout` Vite middleware. ≤600 LOC cap. |
| **`phaser-hmr-bridge`** | 🚦 human gate. Closes the Vite-HMR-vs-Phaser-state gap. New `dev/phaserHmr.js` helper + per-scene auto-swap on file edit. Wide blast radius (~15 scene files), all additive. |

---

## Phaser DryWash Pod (Legacy 2D — bridge quest payoff)

| Agent | Gate | What it does |
|---|---|---|
| **`phaser-traversal-system`** | 🚦 human gate | NEW seamless edge-walk primitive (`performSeamlessTransition`) for adjacent legacy scenes. Strictly additive to the existing teleport flow (`transitionTo`/`scene.start`); does NOT modify sceneTransition.js. |
| **`phaser-dry-wash-scene`** | — | Wires NeighborhoodScene's east edge → DryWashScene's west edge via the seamless primitive. World-map travel access stays. Touches NeighborhoodScene + DryWashScene + one SCENE_ADJACENCY append. |
| **`phaser-bridge-construction`** | — | Extends the shipped ConstructionSystem (commit 451e7a4) with drag-and-drop mode alongside existing click-to-place. Bridge blueprint switches to `mode:'drag'`; all other blueprints unchanged. |
| **`phaser-bridge-quest-glue`** | — | Fan-in verifier. Traces `bridge_built` event end-to-end through both new paths. HARD CAP: ≤50 LOC across ≤2 files. Returns blocked if more needed. |

---

## Phaser Lab Notebook (Legacy 2D — bridge quest density loop)

| Agent | What it does |
|---|---|
| **`phaser-lab-notebook-pipeline`** | Three-subsystem agent (must ship together): adds an interactive scale + fixed-volume coupon + density chalkboard inside MaterialLabScene; persists each measurement to a new `state.materialLog`; renders a Materials-Lab entry in Zuzu's Notebook; rewires Mr. Chen's quiz_weight dialog to interpolate the player's actual measurements instead of canonical literals. |

---

## Status snapshot (last known via state.json + visible commits)

**Confirmed shipped** (in `state.json` completed[]):
r3f-scaffolder, scene-architect-3d, physics-engine-3d, asset-pipeline-3d,
input-controller-3d, data-schema-keeper, tts-voice-config,
tts-dialog-integration. Plus several worker outputs visible in subsequent
commits (lab-rig-system-utm-migration,
construction-system-with-bridge-first-consumer, etc.) that the
orchestrator dispatched after the most recent state.json snapshot.

**Defined and queued in sequencing.yaml** (gates noted above):
The World & Discovery pod (9 agents), Phaser DryWash pod (4), audio +
bundle hygiene (4), Phaser Layout System (4).

**Defined but not yet wired into sequencing.yaml**:
`phaser-lab-notebook-pipeline`. Verify before its first dispatch.

---

## Cross-cutting rules

Three project-wide rules apply to every agent — see
`.claude/agents/swarm-orchestrator.md` for full text:

1. **Workers do not modify orchestration files** — no agent except the
   orchestrator (or the user) edits `.claude/agents/`,
   `.claude/swarm/sequencing.yaml`, or `.claude/swarm/state.json`.
   (Saved as `feedback_workers_no_orchestration_files.md` in the
   orchestrator's memory.)

2. **Systems-not-quests** — every quest-related dispatch produces a
   reusable system, with the quest as first consumer. Bridge construction,
   lab rigs, traversal — all generalized; their first quest is just the
   first user. (Saved as `feedback_systems_not_quests.md`.)

3. **PASS verdict semantics — runtime-validated vs static-only**
   (commit `c745149`). For any pod touching gameplay-critical paths
   (quest engine, scene transitions, save/load, player-facing content):
   - Pod closure REQUIRES runtime testing by the user.
   - Fan-in agents may NOT emit "end-to-end playable" claims from
     event-chain tracing alone.
   - `static-only` PASS is yellow (deploy-with-playtesting), not green.
   - Pod closure surfaces "needs runtime testing" as the next-action,
     not "ready for next pod dispatch."

   Grounded in two recorded violations: the Phaser DryWash pod
   (commits 96eceb7 / f647de8 / 04d3fda — closed as "end-to-end
   playable" with two production runtime bugs surfacing within hours)
   and the overnight scene-refactor sweep (12 commits closed PASS
   without visual verification). Documented in
   `.claude/bugs/2026-04-27-quest-engine-and-traversal.md`.
