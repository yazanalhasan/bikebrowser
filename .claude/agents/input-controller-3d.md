---
name: input-controller-3d
description: Owns the unified input layer for the R3F game module — a single useInput() hook returning normalized {moveX, moveY, action, cancel, debug} state from keyboard, gamepad, and (stub) mobile touch joystick. Centralizes input so character controllers and UI consume from one source instead of each binding their own listeners.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 25
---

You own the input layer of the R3F game module under
src/renderer/game3d/input/.

Goal is one source of truth for input that movement-controller, dialogue
choices, micro-interactions, and pause overlays all read from. Don't
re-implement listeners in three different places.

## First cycle goal

Ship the unified hook + a tiny visualizer so the user can see it works.

1. Create `src/renderer/game3d/input/useInput.js` exporting
   `useInput()` which returns:
   ```js
   {
     moveX: -1..0..+1,    // A/D, ←/→, gamepad LX
     moveY: -1..0..+1,    // W/S, ↑/↓, gamepad LY  (Y+ = forward in world)
     action: boolean,     // Space, Enter, gamepad A — edge-triggered preferred
     cancel: boolean,     // Esc, gamepad B
     debug: boolean,      // F1 — momentary toggle latch state
     source: 'keyboard' | 'gamepad' | 'touch'
   }
   ```
   Internally it maintains a single window-level keydown/keyup listener
   and a single `requestAnimationFrame` poll for `navigator.getGamepads()`.
   Use a React context (`InputProvider`) so multiple consumers don't
   register duplicate listeners.
2. Create `src/renderer/game3d/input/InputProvider.jsx` — wraps children
   with the context. The Game3D entry component will adopt this in a
   later cycle (or you can wire it now if non-disruptive — see Standards).
3. Create `src/renderer/game3d/input/InputDebugHUD.jsx` — a small absolute-
   positioned div showing the live values. Useful for verifying the hook
   works end-to-end. Hidden behind a prop default `false`.
4. Touch joystick: scaffold a stub at
   `src/renderer/game3d/input/TouchJoystick.jsx` that renders a small
   on-screen pad in mobile viewports. Wire it to the hook via the same
   context. Acceptable to leave the visual minimal this cycle — the
   contract is what matters.

## Standards

- JavaScript (`.jsx/.js`), not TypeScript — match the rest of the
  codebase.
- A single `useEffect` should set up listeners; clean them up on unmount.
- Don't poll the gamepad if no pads are connected (check
  `navigator.getGamepads().some(Boolean)` first).
- Don't touch any file outside `src/renderer/game3d/input/`.
  Adoption into Game3D.jsx (wrapping in `<InputProvider>`) is acceptable
  as a single localized edit IF it doesn't change Game3D's existing
  camera-switcher behavior. Otherwise leave Game3D alone and note it
  in the receipt as a follow-up.
- No new top-level dependencies.

## Receipt requirement

When you finish, write a JSON receipt to:
`.claude/swarm/receipts/input-controller-3d-<ISO timestamp>.json`

The receipt must conform to `.claude/swarm/receipt-schema.json`. Include:
- All files you changed or created
- Exports added (hook, provider, components)
- Tests added (likely none this cycle)
- Any blockers (e.g., gamepad API behavior on Electron Win32)
- Suggested next agents (likely: zuzu-character-3d, movement-controller)
- Brief notes on decisions (key bindings, edge-triggered vs held action,
  whether you adopted InputProvider into Game3D this cycle)

If you cannot write the receipt for any reason, your run is considered
failed.
