# Observed vs Expected Master Baseline

Date: 2026-05-27

## Baseline Commit

Confirmed current clean Act 1 substrate commit exists:

```text
ef469c8 Add playable Act 1 game-rebuild substrate
```

Recent log:

```text
ef469c8 Add playable Act 1 game-rebuild substrate
737eeda fix: complete Act 1 truth pass
a4f2d71 checkpoint: baseline before Act 1 truth pass
21b8490 feat: rescue bike repair visual correctness
1704779 feat: add interactive Mr Chen bridge notebook lesson
```

## Current Observed State

Act 1 `/game-rebuild` is:

- playable from start to Act 1 completion
- data-driven through Act 1 quest/dialogue/notebook/material/ecology/chemistry data
- validated by Playwright
- visually warmer after child-facing refinement
- audio/TTS architecture-ready
- screenshot-captured across major progression states
- backed by portable systems rather than scene-owned quest logic

The current experience still shows its scaffold:

- placeholder geometry remains the dominant visual substrate
- HUD is functional but still heavier/debuggier than ideal
- NPCs have voice profiles and small visual cues but not final character art
- notebook reads as a useful panel, not yet a treasured field journal
- UTM communicates results but does not yet feel physically tactile
- bridge repair is understandable but not yet a full emotional payoff
- ecology and chemistry still read more like stations than lived-world interactions
- final authored music/ambience/SFX assets are not integrated

## Expected Target State

Observed equals expected only when Act 1 feels like:

- a complete child-facing educational adventure
- an emotionally warm Sonoran neighborhood story
- a world that guides curiosity without relying on debug-like UI
- a place where NPCs are memorable
- a garage/workbench that feels iconic and safe
- a notebook that feels like Zuzu's treasured field journal
- a UTM/material testing loop that feels tactile and informative
- a bridge repair climax that feels satisfying
- ecology and chemistry interactions embodied in a living world
- audio/TTS/music/ambience that support emotion and accessibility
- production art integrated through Aseprite/final asset paths, never raw AI art

## Gaps From Child-Facing Audit

Source:

- `docs/game_rebuild/child_facing_experiential_audit.md`
- `docs/game_rebuild/child_facing_walkthrough_report.md`

Open gaps:

- final production art for Zuzu, NPCs, bridge, garage, notebook, UTM, ecology, chemistry
- normal-play HUD should be less dashboard-like
- notebook needs sketch/card visual structure
- UTM needs deformation/comparison feedback
- bridge needs a stronger before/after payoff
- NPC identity needs authored silhouettes and posture
- ecology and chemistry need more environmental staging

Closed or partially closed gaps:

- road dominance reduced through palette/contrast
- garage/workbench gained warmer identity
- bridge/gate gained stronger focal pull
- Zuzu readability improved
- interaction rings softened
- notebook and feedback language became more child-facing

## Gaps From Audio/TTS Audit

Source:

- `docs/game_rebuild/audio_tts_baseline_report.md`
- `docs/game_rebuild/audio_tts_polish_report.md`

Open gaps:

- final authored music loops
- final ambience layers
- final SFX for notebook, UTM, bridge repair, chemistry, map unlock, trust
- platform-independent production voice quality
- direct audio/video capture validation
- deeper Spanish/Arabic expansion, pending human-authored cultural/language brief
- accessible in-game audio settings UI

Closed or partially closed gaps:

- speech normalization exists and is tested
- NPC voice profiles exist
- dialogue routes through audio system
- audio state is inspectable through `window.__GAME__`
- speech interruption/replay/settings hooks exist
- audio Playwright suite passes

## Screenshots

Current major Act 1 captures:

- `playtest_captures/game_rebuild_act1_complete/01_act1_start.png`
- `playtest_captures/game_rebuild_act1_complete/02_bike_repair_notebook.png`
- `playtest_captures/game_rebuild_act1_complete/03_bridge_discovery.png`
- `playtest_captures/game_rebuild_act1_complete/04_material_testing.png`
- `playtest_captures/game_rebuild_act1_complete/05_ecology_interaction.png`
- `playtest_captures/game_rebuild_act1_complete/06_chemistry_interaction.png`
- `playtest_captures/game_rebuild_act1_complete/07_trust_language_notebook.png`
- `playtest_captures/game_rebuild_act1_complete/08_bridge_repaired_map_unlock.png`

Child-facing review captures:

- `playtest_captures/game_rebuild_child_facing_review/01_act1_start.png`
- `playtest_captures/game_rebuild_child_facing_review/03_bridge_discovery.png`
- `playtest_captures/game_rebuild_child_facing_review/08_bridge_repaired_map_unlock.png`

Audio/TTS review captures:

- `playtest_captures/game_rebuild_audio/01_spanish_dialogue_tts.png`
- `playtest_captures/game_rebuild_audio/02_map_unlock_audio_state.png`

## Validation Results

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Results:

- Build: passed
- Playwright `/game-rebuild` suite: 12 passed
- CUDA visual QA: 8 images, 0 findings

## Dirty Worktree Exclusions

The worktree contains unrelated or not-yet-scoped changes that must not be staged blindly.

Exclude from observed-vs-expected commit unless explicitly scoped later:

- `BikeBrowserWorld/**` Godot tire repair files and Godot exported web files
- `project_audit/**` unrelated workstation/ComfyUI/OpenClaw/audit artifacts
- broad `playtest_captures/**` historic/manual/legacy screenshots unrelated to final Act 1 captures
- `tools/comfyui-*.ps1` and other unrelated ComfyUI helper scripts
- `graphics_review_export/**`
- `backups/**`
- `long_path_import_2026-05-18/**`
- `screenshot_baselines/**`
- `visual_diffs/**`

Current in-scope dirty work from recent passes:

- `docs/game_rebuild/audio_tts_*.md`
- `docs/game_rebuild/child_facing_*.md`
- `docs/game_rebuild/observed_expected_*.md`
- `src/game/data/act1/act1Dialogue.js`
- `src/game/phaser/audio/**`
- `src/game/phaser/scenes/DialogueScene.js`
- `src/game/phaser/scenes/NeighborhoodScene.js`
- `src/game/phaser/systems/Act1RuntimeSystem.js`
- `src/game/phaser/systems/AssetRegistry.js`
- `src/game/phaser/systems/DebugDiagnosticSystem.js`
- `src/game/phaser/systems/DialogueSystem.js`
- `tests/e2e/game-rebuild.audio.spec.js`
- selected `playtest_captures/game_rebuild_*` folders if repo policy allows screenshots
