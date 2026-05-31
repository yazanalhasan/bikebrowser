# Final Act 1 Master Gap Report

Date: 2026-05-27

## Validation Baseline

Commands run:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Results:

- Build: passed
- Playwright: 13 passed
- CUDA visual QA: 8 images, 0 findings

## Gap Matrix

| Category | Expected | Observed | Current gap | Emotional impact | Gameplay impact | Architectural risk | Priority |
|---|---|---|---|---|---|---|---|
| NPC identity | NPCs are immediately memorable through silhouette, color, posture, voice, and place. | Voice identity exists; small visual cues exist; sprites remain placeholders. | Needs production NPC sprites and registry/dialogue cleanup. | Characters feel functional more than loved. | Player follows labels, not social memory. | Low if AssetRegistry owns art; medium if scene-specific art hacks creep in. | High |
| Bridge payoff | Bridge repair feels like "I fixed the world." | Bridge can be repaired; visual before/after is still understated. | Needs broken/repaired art, transition timing, crossing moment, audio cue. | Act 1 climax feels useful but not triumphant. | Repair objective completes but reward is mostly textual. | Low if state remains in ConstructionSystem. | High |
| Garage warmth | Garage is iconic safe creative sanctuary. | Warm glow and station cluster exist. | Needs authored garage/workbench sprite, tactile props, audio ambience. | Home base is improving but not iconic. | Player understands where tools are, but may not emotionally bond. | Low if scene uses stable asset key. | High |
| Notebook charm | Notebook feels treasured and discovery-driven. | Journal page, tabs, clue snippets, star markers exist. | Needs final frame/cards/icons, interactive categories, page feel. | Notebook is warmer but not yet an artifact. | Evidence loop works; review UX is shallow. | Low if NotebookSystem stays source of state. | High |
| UTM tactileity | Testing feels physical and changes what the child knows. | Materials test and feedback work; rig still static. | Needs deformation/comparison animation, material response timing, sound. | Testing feels smart but not tactile. | Learning is clear, but cause/effect is not embodied enough. | Medium if visual state is hardcoded instead of data-driven. | High |
| Ecology embodiment | Ecology feels like observing a living desert habitat. | Ecology interaction works; visual remains station-like. | Needs habitat cues, shade/water logic visuals, plant token art. | Stewardship is stated, not deeply felt. | Player gets entries but may not infer ecology from world. | Low if observation logic remains in EcologyObservationSystem. | Medium |
| Chemistry embodiment | Chemistry feels like safe mixing/drying/useful transformation. | Recipe works; station is static. | Needs visual mixing/drying state, safe handling cue, output sprite. | Experiment lacks anticipation. | Chemistry progress is mechanically clear but sensory thin. | Low if ChemistrySystem remains data owner. | Medium |
| Map/discovery excitement | Wider map unlock feels exciting but restrained. | Gate focal cue and text exist. | Needs field-map reveal moment and map UI identity. | Wider world feels hinted, not yet exciting. | Unlock works, but curiosity payoff is text-led. | Low. | Medium |
| Child-facing HUD | HUD is soft, minimal, warm, non-dashboard-like. | `Today's trail` and `Current clue` exist; debug hidden. | Needs final HUD art and surfaced audio/accessibility controls. | Less debuggy now, but still boxy. | Guidance is clear. | Low. | Medium |
| Voice identity | NPC voices are distinct and readable. | Voice profiles, normalization, tests pass. | Browser TTS quality varies; final voice strategy undecided. | Voices support identity but can sound platform-dependent. | Accessibility improved. | Low. | Medium |
| Ambience/music | Soundscape supports warmth, garage safety, bridge payoff. | Architecture exists; no authored loops/cues. | Needs licensed-safe/generated-local audio assets and balance. | World is visually warmer than sonically. | No gameplay blocker. | Medium if asset licensing/source unclear. | Medium |
| Silhouette readability | Player, NPCs, tools, bridge read without labels. | Zuzu outline improved; placeholders still similar. | Needs production silhouettes and less reliance on labels. | World still feels labeled. | Interaction remains readable through prompts. | Low. | High |
| Landmark hierarchy | Child reads home, garage, wash, bridge, gate quickly. | Hierarchy improved with glow/focal cues. | Needs authored landmarks and final map/bridge/garage art. | Place identity is moderate. | Navigation is adequate. | Low. | Medium |
| Traversal rhythm | Movement through neighborhood feels natural and exploratory. | Movement smooth; layout is simple and road-heavy. | Needs stronger environmental rhythm and destination staging. | Exploration feels functional, not delightful. | No blocker. | Low. | Medium |
| Interaction clarity | Child sees what to do without clutter. | Prompts and halos clear; world still prompt-reliant. | Needs visual affordances in final art. | Curiosity relies on UI. | Clear and playable. | Low. | Medium |
| Progression pacing | Act 1 unfolds as observe/test/decide/build/unlock. | Quest progression works; some beats are condensed. | Needs tactile pauses/reward timing around UTM and bridge. | Emotional arc is flatter than expected. | Full completion works. | Low. | Medium |
| Save/load robustness | Act 1 state persists safely. | Tests pass. | No current gap. | Stable. | Stable. | Low. | Low |
| Accessibility | Speech, subtitles, reduced audio, replay, readable UI. | Runtime hooks and tests exist. | Needs in-game settings/accessibility controls. | Accessibility exists under the hood, not player-facing. | Test hooks work. | Low. | Medium |
| Environmental storytelling | World feels like a real Sonoran neighborhood with history and purpose. | Dusk, garage glow, wash cues exist. | Needs authored environment assets and purposeful landmarks. | Still partly stage-like. | No blocker. | Low. | High |
| Visual clutter | Sparse, intentional, no debug sludge. | CUDA QA passes; HUD lighter; notebook fits. | Risk will return during art pass if overdecorated. | Current clarity is good. | Stable. | Medium during production art integration. | Medium |
| Debug leakage | Normal play hides raw state/debug. | F3 debug hidden; normal HUD reduced. | Asset final/fallback status remains debug-hook only, which is appropriate. | Good. | Good. | Low. | Low |
| Emotional coherence | Act 1 feels warm, tactile, memorable, real. | Playable and warmer, but still scaffold-visible. | Needs sensory identity pass across art/audio/animation. | This is the main remaining gap. | Game works but does not yet fully sing. | Medium if art pass disrupts architecture. | Highest |

## Master Verdict

`Observed != Expected`.

The game is stable, testable, and substantially more child-facing than the original substrate. The remaining gap is authored sensory identity: production silhouettes, tactile testing, bridge payoff, embodied ecology/chemistry, final notebook/HUD art, and soundscape.

## Implementation Priorities

1. Final art direction and production asset contract.
2. Tactile UTM and bridge payoff because they are the educational/emotional spine.
3. NPC and Zuzu silhouettes because they determine child memory.
4. Notebook final art because it anchors evidence ownership.
5. Ecology/chemistry embodiment and ambient soundscape.
6. Mobile and final visual QA.

## Update: First Production-Preview Art Integration

After the baseline audit, a first hand-authored production-preview asset batch was integrated through the AssetRegistry. Runtime PNGs now live in `src/game/art/final/act1/`, with matching `.aseprite` sources in `src/game/art/source/aseprite/act1/`.

Closed or reduced gaps:

- Zuzu now uses authored runtime art instead of generated Phaser geometry.
- Mr. Chen, Mrs. Ramirez, and Auntie Mariam now have distinct authored sprites.
- Garage/workbench now has an authored landmark sprite and remains the warm focal point.
- Broken and repaired bridge states now use separate authored sprites and swap at runtime.
- UTM, chemistry, ecology, material samples, notebook, HUD frame, and map gate assets exist as first-pass final-ready art.
- AssetRegistry now reports all required Act 1 first-batch assets as `final_ready`, with `generatedRuntimeArt: false`.
- Opening camera/staging now places the first interaction prompt on Mr. Chen instead of drifting to Mrs. Ramirez.
- UTM now has a small visual material deformation indicator tied to material test results.
- Ecology and chemistry now have small embodied world-state indicators rather than only station labels.

Validation after this update:

```powershell
npm run build
npm run test:e2e -- game-rebuild.smoke.spec.js game-rebuild.act1-complete.spec.js game-rebuild.act1-visual-capture.spec.js game-rebuild.act1-polish.spec.js game-rebuild.audio.spec.js
py -3 tools\analyze_visual_runtime_cuda.py --input playtest_captures\game_rebuild_act1_complete
```

Results:

- Build passed.
- Full Act 1/audio/visual Playwright suite passed: 13/13.
- CUDA visual runtime analysis passed with 0 findings across 8 captures.

Remaining high-value gaps:

- The art is still production-preview quality and needs a human art-director paintover.
- Zuzu needs walk/bike animation frames.
- UTM tactileity needs richer timing and comparison animation.
- Bridge repair still needs an emotional transition beat, NPC acknowledgement, and stronger audio cue.
- Ecology and chemistry still need more world-embedded state changes.
- Mobile readability remains unverified after the art pass.
