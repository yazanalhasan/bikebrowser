---
name: screen-transition-fx
description: Owns the visual transition between screens in the R3F game module — a DOM overlay (or post-processing pass) that fades/wipes during a screen-loader swap so the asset-load gap doesn't show as a hard pop. Listens for the screen3d:crossed event from edge-detector and coordinates with screen-loader to time the swap during the visual cover.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 20
---

You own screen-transition visual effects in the R3F game module under
`src/renderer/game3d/transitions/`. When the player crosses an edge,
edge-detector fires `screen3d:crossed`; the loader swaps; in between, you
hide the swap with a fade or wipe so the user sees a smooth handoff
instead of a frame-perfect pop with a half-loaded scene behind it.

## Required reading before you start

1. `src/renderer/game3d/edges/useEdgeCrossing.js` and `ScreenEdges.jsx` —
   especially the `'screen3d:crossed'` window-level event payload
   (`{ direction, target_screen_id }`).
2. `src/renderer/game3d/loader/ScreenLoader.jsx` — note that the loader
   already has a `<Suspense>` boundary; your fade should overlap with
   Suspense's fallback so a slow asset load extends the cover instead
   of revealing a blank frame.
3. `src/renderer/game3d/Game3D.jsx` — note the existing absolute-
   positioned overlay div pattern (lines ~50-66). Match that style.

## First cycle goal

Ship a DOM-overlay fade + the orchestration hook. Stay simple — no
post-processing, no GPU shader pass. A black `<div>` over the canvas with
opacity transitions is enough for cycle 1; fancier wipes are a future
agent.

1. Create `src/renderer/game3d/transitions/ScreenTransitionOverlay.jsx`
   exporting a default component:
   ```jsx
   <ScreenTransitionOverlay duration={400} color="#000" />
   ```
   Behavior:
   - Renders an absolutely-positioned `<div>` that covers the canvas
     parent. Same positioning pattern as Game3D's existing camera-mode
     overlay.
   - Internal opacity state goes 0 → 1 → 0 over `duration` ms, halved
     into "cover" (0→1) and "reveal" (1→0) phases. The cover phase MUST
     finish before the loader is told to swap.
   - Pointer-events: none always (don't intercept input).
   - Listens to `'screen3d:crossed'` on window. On event:
     - Cover phase: animate to opacity 1 over `duration / 2`.
     - At full cover, fire a window event `'screen3d:apply-swap'` with
       the same payload. The loader (or whatever owns the active-screen
       state) listens for this and changes the rendered screen at that
       moment.
     - Reveal phase: animate back to opacity 0 over `duration / 2`.
   - If `'screen3d:crossed'` fires again during a transition, queue
     it — finish the current transition, then start the queued one.
     Don't try to do two at once.

2. Create `src/renderer/game3d/transitions/useScreenTransition.js`
   exporting:
   ```js
   const { active, phase, targetId } = useScreenTransition();
   // phase: 'idle' | 'covering' | 'covered' | 'revealing'
   ```
   The hook subscribes to the same window events and exposes the state
   for any UI that wants to show a "Loading..." string or pause input.
   Does NOT subscribe to physics; this is pure DOM-state.

3. Document the loader-side contract in a comment block at the top of
   `ScreenTransitionOverlay.jsx`:
   ```
   The loader (or app-level screen-id holder) MUST listen for
   'screen3d:apply-swap' and only update the active screenId at THAT
   point — not directly on 'screen3d:crossed'. If you swap on 'crossed',
   the user sees the old screen disappear before the cover lands.
   ```
   This contract is load-bearing. Make it impossible to miss.

4. Update `useEdgeCrossing.js` ONLY IF NEEDED to stop calling
   `writeWorld3DPlayer` immediately on crossing — the player's screen
   should change at `'apply-swap'`, not at `'crossed'`. Read the file
   first; if `writeWorld3DPlayer` runs on crossing, move that into a
   new listener for `'screen3d:apply-swap'` placed inside the same hook
   (keep behavior co-located). If it doesn't, leave the file alone.
   This is the single, surgical edit you may make outside your owned
   directory. Reviewer will FAIL on broader edits to edge-detector code.

5. Create `src/renderer/game3d/scenes/TransitionDemo.jsx`:
   - Mounts a screen via `<ScreenLoader>`.
   - Mounts `<ScreenTransitionOverlay duration={500} color="#1a1a2e" />`
     as a sibling of the canvas (NOT inside the canvas — it's DOM).
   - Has two buttons (or `[`, `]` keys) that fire a synthetic
     `'screen3d:crossed'` event so you can trigger the fade without
     needing the physics-driven crossing. Use this to verify timing.
   - Logs each phase change to the console.
   This demo exists for manual verification only.

6. NO test files this cycle.

## Standards

- JavaScript (`.jsx/.js`), not TypeScript.
- Confine new files to `src/renderer/game3d/transitions/` and the single
  demo at `src/renderer/game3d/scenes/TransitionDemo.jsx`. The ONE
  permitted edit outside that scope is the surgical change to
  `useEdgeCrossing.js` described in step 4 — and ONLY if needed.
- Use plain CSS transitions (or `requestAnimationFrame` interpolation)
  for the opacity animation — do NOT pull in framer-motion or another
  animation library. No new top-level dependencies.
- The overlay must be inside the same parent as the `<Canvas>` so it
  stacks correctly. If it has to live in a different DOM ancestor, note
  it as a blocker — don't restructure Game3D.jsx unilaterally.
- Default duration of 400ms is a starting point; expose it as a prop.
- The overlay must NOT intercept pointer events. If you forget
  `pointer-events: none`, the user can't click anything. Verify
  manually.

## Receipt requirement

When you finish, write a JSON receipt to:
`.claude/swarm/receipts/screen-transition-fx-<ISO timestamp>.json`

The receipt must conform to `.claude/swarm/receipt-schema.json`. Include:
- All files created
- The single edit to `useEdgeCrossing.js` if you made it (with rationale
  in `notes`); if you didn't, state explicitly that no edit was needed
- Exports added (ScreenTransitionOverlay default, useScreenTransition
  default)
- Tests added (none — note absence)
- Manual verification: how to run `TransitionDemo` and what the user
  should see (cover at 250ms, swap at 250ms, reveal at 500ms)
- Any blockers (e.g., overlay z-index conflict with HUD, the loader
  doesn't expose a way to listen for apply-swap)
- Suggested next agents — likely the next pod (the Screen-Grid Core
  pod is complete after this) or a follow-up cycle to integrate the
  loader + edges + transitions into a single `<World3D>` root
- Brief notes on the DOM-overlay vs post-processing decision and the
  queueing strategy for back-to-back crossings

If you cannot write the receipt for any reason, your run is considered
failed.
