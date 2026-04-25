# input-controller-3d — NEEDS_REVISION

- **Verdict by:** code-quality-reviewer (sonnet override)
- **Reviewer receipt:** `.claude/swarm/receipts/code-quality-reviewer-2026-04-25T10-45-00Z.json`
- **Worker receipt:** `.claude/swarm/receipts/input-controller-3d-2026-04-25T09-15-00Z.json`
- **Status in state.json:** `partial` (NOT in `completed[]`)

All CRITICAL checks PASSED — scope is contained, camera-switcher (1/2/3) and physics-debug ('P') untouched, KEY_MAP avoids reserved keys, no TS, no package.json change, return shape matches spec.

## Issues to fix in cycle 2

### MEDIUM 1 — Gamepad action is not edge-triggered

`src/renderer/game3d/input/InputProvider.jsx` lines ~121-124. Gamepad A re-sets `actionPending.current = true` every rAF frame while held, because the poll runs unconditionally and lacks a "not already pending" guard. The keyboard path correctly gates on `!e.repeat`, but the gamepad path does not. Worker receipt's claim that "Gamepad A button is also edge-triggered via the same pending mechanism" is **incorrect**.

**Fix:** guard the gamepad write with `if (!actionPending.current)` (and the symmetric one for `GP_BTN_B` / `cancelPending`) so the pending flag arms only on the rising edge.

### MEDIUM 2 — Gamepad poll runs every frame unconditionally

The agent definition explicitly says: *"Don't poll the gamepad if no pads are connected (check `navigator.getGamepads().some(Boolean)` first)."*

The current rAF tick calls `navigator.getGamepads()` + `Array.from(pads).find(Boolean)` every frame regardless of connection state. Worker chose this as a design decision; the cost is small but it's a literal standards breach.

**Fix:** track connection via `gamepadconnected` / `gamepaddisconnected` events into a `connectedRef`; skip the `getGamepads()` call when false.

### LOW — Dead variable

`src/renderer/game3d/input/TouchJoystick.jsx` line ~61: `const touch = e.touches[0]` is declared in `handleTouchStart` but never read. Remove it.

## Recommended next move

Re-dispatch `input-controller-3d` for a focused cycle 2 with this exact fix list. The worker should NOT touch any other behavior — just these three points and a fresh receipt. Then re-review (sonnet override).
