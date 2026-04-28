# Gameplay troubleshooting handoff

Use this when a gameplay problem needs to be handed to backend/coder agents.
The goal is to translate a playtest symptom into a bounded engineering task:
repro, failing contract, owned files, acceptance checks, and receipt.

## Fast triage

Classify the problem before dispatching it.

| Symptom | Likely owner | Evidence to collect |
|---|---|---|
| Quest advances, blocks, or rewards incorrectly | Quest/data/system coder | Save state, active quest id, step index, observations, inventory |
| Player cannot reach an area or transition fails | Scene/traversal coder | Source scene, target scene, player position, active scene before/after |
| Interactable exists but does nothing/wrong thing | Scene/system integration coder | Interactable label, active quest, inventory, dialog shown |
| Runtime audit warning/error | System/data coder | Full audit row, file path named by audit, whether game still boots |
| Save/load mismatch | Save-system coder | Save JSON before action, save JSON after reload, migration version |
| Backend/API feature missing in game UI | Backend + renderer integration coder | Endpoint/IPC expected, request payload, response shape, UI consumer |

If the symptom is purely Phaser gameplay and uses `localStorage`, it probably
does not need the Express API server. If it touches search, shopping, AI
providers, or Electron IPC, include the backend/API owner.

## Required handoff packet

Every dispatch should include these fields.

```md
## Symptom
What the player sees, in one sentence.

## Repro
1. Start from scene:
2. Save state or setup:
3. Player action:
4. Actual result:
5. Expected result:

## Current game state
- activeScene:
- activeQuest:
- stepIndex:
- inventory:
- observations:
- completedQuests:
- player position:

## Boundary
Own these files:
- ...

Do not modify:
- ...

## Contract
The fix is correct when:
- ...

## Verification
Run or perform:
- ...

## Receipt
Write `.claude/swarm/receipts/<agent>-<ISO timestamp>.json` conforming to
`.claude/swarm/receipt-schema.json`.
```

## How to capture state

In a dev build, the game exposes `window.__phaserGame`. From DevTools:

```js
const active = window.__phaserGame.scene.scenes.find((s) => s.scene.isActive());
({
  activeScene: active?.scene.key,
  gameState: active?.registry.get('gameState'),
  runtimeAudit: window.__runtimeAuditResult,
});
```

For save-level work, use `tools/inspect-save.js` or copy
`localStorage.bikebrowser_game_save` from DevTools. Do not ask a coder to infer
quest state from screenshots alone.

In-game reports created from the `BUG` button are stored in:

```js
JSON.parse(localStorage.bikebrowser_gameplay_reports || '[]')
```

Each report includes the user's typed note plus the active scene, active quest,
inventory, observations, completed quests, player position, and runtime audit
result. Use the panel's "Copy for programmer" action when possible; it formats
the report as a Markdown handoff.

## Backend/coder dispatch rules

- Give agents systems and data boundaries, not vague gameplay intent.
- For carry-forward systems, own `src/renderer/game/systems/` plus needed
  `src/renderer/game/data/` definitions. Do not couple the system to a scene.
- For scene integration, own one scene plus its layout JSON. Static positions
  must be added to `public/layouts/<scene>.layout.json` before scene code reads
  them through `loadLayout()`.
- For quest issues, prefer data-driven fixes in `data/quests.js`,
  `data/items.js`, `data/sceneItemGrants.js`, or system-level gates. Scene code
  should emit observations or mount systems; it should not become a quest engine.
- For backend/API issues, state the request/response contract explicitly and
  identify whether the caller is React, Phaser, Electron IPC, or Express HTTP.
- Require a verification path that can be repeated by someone who did not write
  the fix.

## Good dispatch example

```md
Agent: phaser-quest-observation-gate

Symptom: `bridge_collapse` advances past its observe step after a dialog close
even when `state.observations` does not contain `bridge_built`.

Own:
- `src/renderer/game/systems/questSystem.js`
- optional focused check script under `scripts/`

Do not modify:
- scene art/layout
- unrelated quest text

Contract:
- `advanceQuest()` must block observe steps until `requiredObservation` exists.
- Existing completed quests remain completed after load.
- The fix must not auto-emit observations as a shim.

Verification:
- Add or run a Node check that calls `advanceQuest()` with missing and present
  observations.
- Boot `/play` and confirm runtime audit still completes.
```

## Bad dispatch patterns

- "Fix the bridge quest." Too broad; no failing step or state boundary.
- "Backend should make gameplay work." Backend cannot fix renderer-only
  `localStorage` progression without a specific API/IPC contract.
- "Use coordinates from the screenshot." Scene anchors belong in layout JSON.
- "Just make the quest complete." That hides the learning-system failure.

## Recommended next infrastructure

Add a DEV-only test bridge for gameplay E2E:

- `window.__gameTest.getState()`
- `window.__gameTest.getActiveScene()`
- `window.__gameTest.setSave(save)`
- `window.__gameTest.triggerInteractable(label)`
- `window.__gameTest.dismissDialog(choiceIndex)`

This would let backend/coder agents prove gameplay contracts without brittle
canvas coordinates and without needing Electron for renderer-only game flows.
