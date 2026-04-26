---
name: Early Experience Design pod
description: Active pod 2026-04-26 — make the first 10 minutes engaging using existing systems only, no new systems, no progression logic changes. Pause-after-each-agent for user evaluation.
type: project
---

User opened a new pod 2026-04-26 (right after bridge_collapse soft-lock incident closed) called **Early Experience Design**.

**Why:** Make the first 10 minutes of gameplay engaging, intuitive, and memorable.

**How to apply:**

Hard constraints embedded in every agent dispatch for this pod:
1. **Existing systems only** — do NOT add new systems / modules / classes. Edits to existing files only.
2. **Do NOT modify progression logic** — quest steps, requiredItem fields, save migrations, scene unlock requirements are off-limits. Pure UX layer work.
3. **One layer per agent** — visual OR audio OR timing — never combined. Keeps each change small and reviewable in isolation.
4. **Pause after each for evaluation** — orchestrator does NOT auto-dispatch the next agent in this pod. User plays the game, evaluates the change, then explicitly says "go" before the next.

**Focus areas** (the user's six pillars):
1. **Discovery Moments** — enhance first reveal of copper_mine: pacing, visual emphasis, subtle camera
2. **First Resource Interaction** — entering CopperMineScene feels intentional with contextual feedback
3. **Quest Feedback** — bridge_collapse step progression has clear sense of progress + optional narrative
4. **Environmental Teaching** — terrain/landmarks hint where resources are and why
5. **Reduce Friction** — player always knows "what to do next", no implicit knowledge required
6. **Feedback Layering** — differentiate discovery / collection / quest completion sensorily

**Anti-patterns that have already triggered course corrections:**
- Bundling visual + audio + timing into one agent (user explicitly said "each modifies one layer")
- Auto-dispatching the next agent in the pod without user evaluation (user explicitly said "pause after each")
- Adding a new system to "support" UX polish (user explicitly said "Do NOT add new systems")

**File-scope intuition for this pod's agents:**
- WorldMapScene.js (revealNode, _playRevealAnimation, _drainPendingReveals) — most discovery/feedback work lives here
- CopperMineScene.js — first-resource interaction
- GameContainer.jsx for global registry/dialog plumbing only — no new state machines
- audioManifest.js — read-only on most cycles; if a stinger or sfx is needed, recommend adding it as a follow-up audio cycle, not as scope creep
- existing dialog system (registry.set('dialogEvent', ...)) for narrative reinforcement

**Auto mode interaction:** This pod's "pause after each" overrides auto mode for these specific agents. Acknowledge auto mode is active but explicitly stop after each dispatch in this pod and wait for user input.
