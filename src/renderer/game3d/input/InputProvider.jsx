import { createContext, useCallback, useEffect, useRef, useState } from 'react';

// InputContext is exported so useInput.js can consume it, and so
// TouchJoystick can inject touch deltas via the setTouch callback.
export const InputContext = createContext(null);

// Keys mapped to logical axes / buttons.
// Reserved by other systems — must NOT appear here:
//   'p'       — usePhysicsDebug toggle
//   '1','2','3' — camera switcher in Game3D
const KEY_MAP = {
  // Move X (horizontal)
  a:          { axis: 'moveX', value: -1 },
  arrowleft:  { axis: 'moveX', value: -1 },
  d:          { axis: 'moveX', value: +1 },
  arrowright: { axis: 'moveX', value: +1 },
  // Move Y (forward/back — Y+ is forward in world space)
  w:          { axis: 'moveY', value: +1 },
  arrowup:    { axis: 'moveY', value: +1 },
  s:          { axis: 'moveY', value: -1 },
  arrowdown:  { axis: 'moveY', value: -1 },
  // Buttons
  ' ':        { axis: 'action', value: true },   // Space
  enter:      { axis: 'action', value: true },
  escape:     { axis: 'cancel', value: true },
};

// Gamepad button indices (Standard Gamepad layout)
const GP_BTN_A = 0;
const GP_BTN_B = 1;

// Dead-zone for gamepad analog sticks — values below this are treated
// as zero to avoid stick drift.
const GAMEPAD_DEAD_ZONE = 0.12;

function applyDeadZone(v) {
  return Math.abs(v) < GAMEPAD_DEAD_ZONE ? 0 : v;
}

// Clamp to [-1, +1] and round to 3 decimal places to keep state
// updates terse and avoid float churn.
function clampAxis(v) {
  return Math.round(Math.max(-1, Math.min(1, v)) * 1000) / 1000;
}

export default function InputProvider({ children }) {
  // Core state exposed to consumers.
  const [state, setState] = useState({
    moveX: 0,
    moveY: 0,
    action: false,
    cancel: false,
    debug: false,
    source: 'keyboard',
  });

  // Internal bookkeeping (refs — don't trigger re-renders).
  // held: set of currently depressed logical keys
  const heldKeys = useRef(new Set());
  // actionConsumed: true after we've emitted one frame with action=true
  // so we don't hold it open forever (edge-trigger).
  const actionPending = useRef(false);
  const cancelPending = useRef(false);
  // debug is a toggle latch, not a momentary.
  const debugLatched = useRef(false);
  // rAF handle for the gamepad poll loop.
  const rafHandle = useRef(null);
  // Touch joystick deltas — injected by TouchJoystick via setTouch.
  const touchDelta = useRef({ x: 0, y: 0 });
  // Track last source to avoid unnecessary re-renders.
  const lastSource = useRef('keyboard');
  // Fix 2: track whether any gamepad is connected so we can skip the
  // getGamepads() poll when no pad is plugged in.
  const connectedRef = useRef(
    typeof navigator !== 'undefined' &&
    navigator.getGamepads
      ? navigator.getGamepads().some(Boolean)
      : false,
  );
  // Fix 1: previous-frame button state for edge-trigger detection.
  const prevGpButtons = useRef({ a: false, b: false });

  // ----------------------------------------------------------------
  // Touch injection — TouchJoystick calls this to push deltas.
  // ----------------------------------------------------------------
  const setTouch = useCallback((dx, dy) => {
    touchDelta.current = { x: clampAxis(dx), y: clampAxis(dy) };
    lastSource.current = 'touch';
  }, []);

  // ----------------------------------------------------------------
  // Main update — called every rAF frame.
  // Merges keyboard + gamepad + touch into a single state snapshot.
  // ----------------------------------------------------------------
  const tick = useCallback(() => {
    rafHandle.current = requestAnimationFrame(tick);

    let moveX = 0;
    let moveY = 0;
    let action = false;
    let cancel = false;
    let source = lastSource.current;

    // --- Keyboard axes (sum held keys, then clamp) ---
    for (const key of heldKeys.current) {
      const mapping = KEY_MAP[key];
      if (!mapping) continue;
      if (mapping.axis === 'moveX') moveX += mapping.value;
      if (mapping.axis === 'moveY') moveY += mapping.value;
    }

    // --- Gamepad ---
    // Fix 2: skip the getGamepads() call entirely when no pad is connected.
    let activePad = null;
    if (connectedRef.current) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      activePad = Array.from(pads).find(Boolean) ?? null;
    }

    if (activePad) {
      const lx = applyDeadZone(activePad.axes[0] ?? 0);
      const ly = applyDeadZone(activePad.axes[1] ?? 0);

      // Gamepad overrides keyboard axes only when the stick is actually
      // moved — this lets keyboard and gamepad coexist without fighting.
      if (Math.abs(lx) > 0 || Math.abs(ly) > 0) {
        moveX = lx;
        moveY = -ly; // Invert: gamepad Y-down → world Y-forward
        source = 'gamepad';
      }

      // Fix 1: edge-trigger — only arm pending on the rising edge
      // (current=true AND prev=false), mirroring the !e.repeat keyboard guard.
      const currentA = activePad.buttons[GP_BTN_A]?.pressed ?? false;
      const currentB = activePad.buttons[GP_BTN_B]?.pressed ?? false;

      if (currentA && !prevGpButtons.current.a && !actionPending.current) {
        actionPending.current = true;
        source = 'gamepad';
      }
      if (currentB && !prevGpButtons.current.b && !cancelPending.current) {
        cancelPending.current = true;
        source = 'gamepad';
      }

      prevGpButtons.current = { a: currentA, b: currentB };
    } else {
      // No active pad this frame — reset prev state so the next connection
      // starts fresh (avoids a phantom edge from stale prev=true).
      prevGpButtons.current = { a: false, b: false };
    }

    // --- Touch joystick ---
    const td = touchDelta.current;
    if (Math.abs(td.x) > 0 || Math.abs(td.y) > 0) {
      moveX = td.x;
      moveY = td.y;
      source = 'touch';
    }

    // --- Edge-triggered action / cancel ---
    if (actionPending.current) {
      action = true;
      actionPending.current = false; // consumed for this frame
    }
    if (cancelPending.current) {
      cancel = true;
      cancelPending.current = false;
    }

    // If there's keyboard movement, mark source as keyboard (unless
    // gamepad/touch already claimed it above).
    if (source === lastSource.current && (moveX !== 0 || moveY !== 0)) {
      if (!activePad && !(Math.abs(td.x) > 0 || Math.abs(td.y) > 0)) {
        source = 'keyboard';
      }
    }
    // Default to keyboard when nothing active.
    if (source === 'touch' && !(Math.abs(td.x) > 0 || Math.abs(td.y) > 0)) {
      source = 'keyboard';
    }

    lastSource.current = source;

    setState((prev) => {
      const nextMoveX = clampAxis(moveX);
      const nextMoveY = clampAxis(moveY);
      // Only create a new object when something actually changed —
      // avoids unnecessary downstream re-renders.
      if (
        prev.moveX === nextMoveX &&
        prev.moveY === nextMoveY &&
        prev.action === action &&
        prev.cancel === cancel &&
        prev.debug === debugLatched.current &&
        prev.source === source
      ) {
        return prev;
      }
      return {
        moveX: nextMoveX,
        moveY: nextMoveY,
        action,
        cancel,
        debug: debugLatched.current,
        source,
      };
    });
  }, []);

  // ----------------------------------------------------------------
  // Single useEffect — sets up all listeners and the rAF loop.
  // Cleans up fully on unmount.
  // ----------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when focus is inside a text input.
      const tag = (e.target?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      const key = e.key.toLowerCase();

      // F1 — debug toggle latch (doesn't repeat on keydown hold)
      if (key === 'f1') {
        e.preventDefault(); // suppress browser help dialog
        if (!e.repeat) {
          debugLatched.current = !debugLatched.current;
        }
        return;
      }

      const mapping = KEY_MAP[key];
      if (!mapping) return;

      if (mapping.axis === 'action' && !e.repeat) {
        actionPending.current = true;
        lastSource.current = 'keyboard';
      } else if (mapping.axis === 'cancel' && !e.repeat) {
        cancelPending.current = true;
        lastSource.current = 'keyboard';
      } else if (mapping.axis === 'moveX' || mapping.axis === 'moveY') {
        heldKeys.current.add(key);
        lastSource.current = 'keyboard';
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      heldKeys.current.delete(key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Fix 2: track gamepad connection state so the rAF tick can skip
    // navigator.getGamepads() when nothing is plugged in.
    const onGamepadConnected = () => { connectedRef.current = true; };
    const onGamepadDisconnected = () => {
      // Re-check: there might be >1 pad and only one disconnected.
      connectedRef.current =
        navigator.getGamepads ? navigator.getGamepads().some(Boolean) : false;
    };
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    // Start the rAF tick loop.
    rafHandle.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      if (rafHandle.current != null) {
        cancelAnimationFrame(rafHandle.current);
        rafHandle.current = null;
      }
    };
  }, [tick]);

  return (
    <InputContext.Provider value={{ ...state, setTouch }}>
      {children}
    </InputContext.Provider>
  );
}
