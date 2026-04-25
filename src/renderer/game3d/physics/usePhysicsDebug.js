import { useEffect, useState } from 'react';

// Toggles the Rapier debug visualizer (collider wireframes, contact
// points, etc.) when the user presses a dev shortcut. Returns the
// current boolean so the caller can pipe it into <PhysicsWorld debug={..}>.
//
// Default key is `P` (for Physics). Caller can override if it ever
// collides with another binding. Listener is attached to window so
// the toggle works regardless of focused element inside the canvas.
export default function usePhysicsDebug({ toggleKey = 'p', initial = false } = {}) {
  const [debug, setDebug] = useState(initial);

  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs — no need for the visualizer
      // to fight a textbox.
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.key && e.key.toLowerCase() === toggleKey.toLowerCase()) {
        setDebug((d) => !d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleKey]);

  return debug;
}
