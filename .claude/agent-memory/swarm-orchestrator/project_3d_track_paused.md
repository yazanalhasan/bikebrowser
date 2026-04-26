---
name: 3D track paused, 2D game is the product
description: As of 2026-04-25, user paused the 3D R3F module effort and committed to the 2D Phaser game as the shipping product.
type: project
---

The R3F 3D module under `src/renderer/game3d/` (cameras, physics, input, assets, ProofOfLife scene) is paused indefinitely. User compared the 3D preview (movable Player + scene polish) to the 2D Phaser game and said "the 2d version is way way better, let's just stick to that for now."

**Why:**
- The 3D track produced infrastructure only — cameras, Rapier wrapper, input hook, asset manifest. Zero content (no NPCs, quests, items, locations, dialog).
- The 2D game has years of content: full quest system, NPCs with TTS voices, mining, multiple scenes, save system.
- Porting 2D content to 3D would have required a whole new pod of agents (npc-porter-3d, quest-porter-3d, scene-porter-3d, hud-porter-3d) that don't exist in `sequencing.yaml` yet.
- Visual polish gap is huge: even with windmill/trees/bike, the 3D preview reads as a sketch next to the 2D game.

**State at the pause:**
- `state.json` shows Engine Foundation pod complete (scene-architect-3d, physics-engine-3d, asset-pipeline-3d, input-controller-3d) plus Audio pod (tts-voice-config, tts-dialog-integration) and data-schema-keeper.
- The TTS work (both cycles) was actually applied to the **2D game**, not the 3D module — so that user-facing improvement is already live in `src/renderer/game/audio/...` and `GameContainer.jsx`. User benefits from it in the 2D game right now.
- Next planned dispatch was the human-gated `screen-grid-architect`. **Do not dispatch it without explicit user re-approval.**
- The Play 3D HomePage tile has been removed (commit pending). The `/play3d` route still exists in `App.jsx` for dev-only access.
- The `src/renderer/game3d/` tree is left in place — lazy-loaded, doesn't impact 2D bundle.

**Why:** Future sessions might walk into a "swarm online, week 1, pod: Engine Foundation" startup and assume the orchestrator should keep going. It should not — the user has redirected away from this track.

**How to apply:**
- Do not auto-suggest dispatching `screen-grid-architect` or any later 3D pod agent.
- Do not pitch creating new 3D content-porter agents (npc-porter-3d etc.) without user re-approval.
- 2D game work in `src/renderer/game/...` continues normally — quests.js, scenes/*.js, etc. are still active.
- TTS work landed in the 2D game; treat `CHARACTER_GENDER`, `_voiceCache`, `resolveSpeakerToNpcId`, `speakAsNpc` as live 2D-game features, not "3D plumbing."
- If user re-engages with 3D ("let's revisit 3D"), check this memory and the `state.json` completed[] before pitching — most of the engine is already done.
