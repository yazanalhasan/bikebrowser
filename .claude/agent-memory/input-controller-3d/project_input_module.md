---
name: Input module architecture (cycles 1 + 2)
description: What was shipped in cycle 1 and fixed in cycle 2 — provider/hook/HUD/touch contract, adoption into Game3D
type: project
---

InputProvider wraps Game3D's root div. It owns a single window keydown/keyup listener and a single rAF tick loop that polls gamepads. Multiple consumers call useInput() to read { moveX, moveY, action, cancel, debug, source }.

Files created:
- src/renderer/game3d/input/useInput.js — thin context consumer hook
- src/renderer/game3d/input/InputProvider.jsx — all listener + rAF logic lives here
- src/renderer/game3d/input/InputDebugHUD.jsx — visible when visible prop is true (wired to F1 latch)
- src/renderer/game3d/input/TouchJoystick.jsx — stub, auto-shows on mobile viewport
- src/renderer/game3d/input/index.js — barrel export

Game3D.jsx was edited (cycle 1 adoption):
- Added InputProvider wrap around the root div
- Added InputDebugHUDFromContext helper component at module level (calls useInput inside InputProvider)
- Camera switcher and physics-debug listeners were NOT changed

Cycle 2 fixes (code-quality-reviewer NEEDS_REVISION):
- Gamepad A/B buttons are now edge-triggered: prevGpButtons ref tracks previous-frame state; pending flags are armed only on rising edge (current=true AND prev=false). Cycle-1 receipt claim that "gamepad A is edge-triggered via the pending mechanism" was inaccurate — fixed in cycle 2.
- Gamepad poll is now gated on connectedRef (boolean). Initialized from getGamepads().some(Boolean) at mount; kept current via gamepadconnected/gamepaddisconnected window events registered in the same useEffect and cleaned up in the same return. The getGamepads() call in the rAF tick is skipped entirely when connectedRef=false.
- TouchJoystick.jsx: removed dead `const touch = e.touches[0]` from handleTouchStart (was line ~61).

**Why:** One source of truth; downstream movement-controller, dialogue UI, pause overlays all consume useInput() rather than registering their own window listeners.

**How to apply:** In cycle 3+, new consumers (zuzu-character-3d, movement-controller) should import useInput from the barrel and call it inside InputProvider. Never add new window keydown listeners for movement or action outside InputProvider's KEY_MAP.
