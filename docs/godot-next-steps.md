# Godot Next Steps

## First 10 Files to Inspect

1. `src/renderer/game/GameContainer.jsx`
2. `src/renderer/game/config.js`
3. `src/renderer/game/systems/saveSystem.js`
4. `src/renderer/game/systems/questSystem.js`
5. `src/renderer/game/data/quests.js`
6. `src/renderer/game/systems/sceneRegistry.js`
7. `src/renderer/game/entities/Player.js`
8. `src/renderer/game/entities/Npc.js`
9. `src/renderer/game/scenes/ZuzuGarageScene.js`
10. `src/renderer/game/scenes/StreetBlockScene.js`

## First 10 Assets to Migrate

1. `public/assets/game/atlases/zuzu.png`
2. `public/assets/game/atlases/zuzu.json`
3. `public/assets/game/atlases/neighborhood.png`
4. `public/assets/game/atlases/neighborhood.json`
5. `public/assets/game/maps/neighborhood.json`
6. `public/assets/game/tilesets/sonoran_tiles.png`
7. `public/game/maps/neighborhood_world_v1.png`
8. `public/game/audio/music/garage_warm_oud.ogg`
9. `public/game/audio/music/neighborhood_hybrid_ride.ogg`
10. `public/game/audio/stingers/reward_tarabi_stinger.ogg`

## First Godot Scene to Create

Create:

```text
BikeBrowserWorld/scenes/world/Neighborhood.tscn
```

Purpose:

- Prove Zuzu can move in a simple playable neighborhood.
- Add one garage entrance.
- Add Mr. Chen as the first NPC.
- Trigger one dialogue and one mission event.

Keep the scene small. This is a migration probe, not the final neighborhood.

## First Godot Scripts to Create

1. `BikeBrowserWorld/autoload/EventBus.gd`
2. `BikeBrowserWorld/autoload/GameState.gd`
3. `BikeBrowserWorld/autoload/ReactBridge.gd`
4. `BikeBrowserWorld/autoload/SaveService.gd`
5. `BikeBrowserWorld/autoload/RewardBridge.gd`
6. `BikeBrowserWorld/scripts/characters/ZuzuController.gd`
7. `BikeBrowserWorld/scripts/characters/NpcInteraction.gd`
8. `BikeBrowserWorld/scripts/missions/MissionService.gd`
9. `BikeBrowserWorld/scripts/ui/DialogController.gd`
10. `BikeBrowserWorld/scripts/world/TransitionZone.gd`

## First Tests to Write

1. React bridge event schema test for `quest_started`.
2. React bridge event schema test for `reward_intent`.
3. Save bridge test confirming Godot test saves do not overwrite `bikebrowser_game_save`.
4. Mission data export test confirming `chain_repair` can become a Godot mission.
5. Playwright smoke test confirming the Godot test route renders a nonblank canvas/iframe.
6. Playwright smoke test confirming a mission event reaches React.
7. Phaser regression smoke confirming existing `/play` still boots.

## First Web Export Experiment

1. Open Godot from `C:\Godot\Godot_v4.6.2-stable_win64.exe`.
2. Create `BikeBrowserWorld/project.godot`.
3. Build the minimal `Neighborhood.tscn`.
4. Export to a local web folder such as `public/godot/bikebrowser-world/`.
5. Add a temporary React-only test route such as `/godot-prototype`.
6. Embed the export in an iframe or container.
7. Verify:
   - It loads from Vite.
   - Canvas is nonblank.
   - Keyboard input works.
   - Pointer/touch input can be captured.
   - Godot can send a `postMessage` event to React.
   - React can send a hydrate message back.

## Immediate Guardrails

- Do not replace `/play` yet.
- Do not mutate existing Phaser save data from Godot.
- Do not move shopping, video search, allowance ledger, or adult battery planning into Godot.
- Do not hard-code static scene positions in scripts. Preserve the existing data-driven layout rule from `public/layouts/*.layout.json`.
- Keep physical battery build/repair content adult-gated in React.

## First Milestone Definition

The first milestone is complete when:

- Godot opens locally.
- The minimal neighborhood scene runs.
- Zuzu moves.
- Mr. Chen can start a chain/derailleur mission.
- Godot emits a structured reward-intent event.
- React receives the event.
- Existing Phaser `/play` still works.
- Existing tests still pass or any failures are documented with exact cause.
