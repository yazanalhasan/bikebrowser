---
name: Key binding reservations — do not use in KEY_MAP
description: Keys owned by other systems that InputProvider must not intercept
type: project
---

Reserved keys (must not appear in InputProvider's KEY_MAP):
- '1', '2', '3' — camera switcher in Game3D.jsx (side / angled / top)
- 'p' / 'P' — physics debug wireframe toggle (usePhysicsDebug.js in physics/)

F1 is safe for the input debug toggle latch (confirmed no collision).

**Why:** Multiple independent keydown listeners on window coexist fine in the browser, but adding the same key to InputProvider's KEY_MAP would mean the handler runs twice per keydown and could produce unexpected interactions if we ever centralize further.

**How to apply:** Before adding any new key to KEY_MAP, check Game3D.jsx's camera-switcher listener and usePhysicsDebug.js for conflicts.
