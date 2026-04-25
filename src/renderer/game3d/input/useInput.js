import { useContext } from 'react';
import { InputContext } from './InputProvider';

// useInput() — consume the unified input state from the nearest InputProvider.
//
// Returns:
//   moveX   : -1..0..+1  (A/D, ←/→, gamepad LX)
//   moveY   : -1..0..+1  (W/S, ↑/↓, gamepad LY — Y+ is forward in world)
//   action  : boolean    (Space, Enter, gamepad A — edge-triggered: true for one frame)
//   cancel  : boolean    (Esc, gamepad B)
//   debug   : boolean    (F1 — latched toggle)
//   source  : 'keyboard' | 'gamepad' | 'touch'
//
// This hook is a thin consumer wrapper. All listener logic lives inside
// InputProvider so multiple callers never double-register handlers.
export default function useInput() {
  const ctx = useContext(InputContext);
  if (!ctx) {
    throw new Error('useInput must be called inside <InputProvider>');
  }
  return ctx;
}
