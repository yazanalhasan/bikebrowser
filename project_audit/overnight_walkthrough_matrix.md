# Overnight Walkthrough Matrix — 2026-05-18

## 1. Normal Child Path

- Path: home → `/play` → Godot NeighborhoodStreet/Garage slice.
- Worked: canonical route loads Godot, home escape is visible, core repair-region validation passes.
- Confusing: portrait mobile framing still makes the active play band feel small.
- Fix tonight: preserved `/play`, validated, and kept home escape visible.
- Defer: deeper camera/layout pass for portrait play.

## 2. Low-Attention Child Path

- Path: open utility routes without entering data, linger on empty screens.
- Worked: most routes keep home/back/cart navigation.
- Confusing: `/youtube/search` with no query looked busy instead of inviting action.
- Fixed tonight: no-query search now shows a simple invitation and examples.
- Defer: richer empty states for saved notes and safe search.

## 3. Boundary / Wander Path

- Path: route sweep plus Godot transition registry review.
- Worked: side regions are registered and gated from the neighborhood.
- Confusing: `SystemShowcase` is a demo/tooling region and should not be exposed as a normal child path.
- Fix tonight: documented side-region triage.
- Defer: add explicit validation that demo regions remain hidden from `/play` navigation.

## 4. Quest-Completion Path

- Path: Playwright full-game playthrough and Godot vertical slice.
- Worked: browser quest graph passed; Godot vertical slice passed; reward validation stayed green.
- Confusing: browser playthrough completes quest state more than physical player motion.
- Fix tonight: none required.
- Defer: add more player-path Godot tests for actual movement/collision transitions.

## 5. Reload / Re-Entry Path

- Path: e2e boot smokes, save/load-aware route checks, export refresh.
- Worked: `/play` route smoke passes; Godot export refresh succeeds; save services are present.
- Confusing: not enough browser automation yet around Godot save restore after reload.
- Fix tonight: documented as a gap.
- Defer: add reload/re-entry smoke for Godot `SaveService`.

## 6. Mobile Path

- Path: mobile viewport screenshots across all routes.
- Worked: app routes generally remain navigable; spelling trainer mobile layout is readable.
- Confusing: `/play` still has large inactive portrait margins.
- Fix tonight: no deeper Godot scene change beyond prior camera work; risk belongs to next focused pass.
- Defer: mobile-first Godot framing sprint.

## 7. Legacy Tooling Path

- Path: `/legacy-play`, Phaser playthrough tests, runtime audit.
- Worked: legacy route is contained and Playwright coverage passes.
- Confusing: legacy route still looks more like a complete standalone game shell than a contained fallback.
- Fix tonight: no change; preservation is intentional.
- Defer: add copy/metadata that clearly marks `/legacy-play` as fallback if it becomes child-visible.

## 8. Error Recovery Path

- Path: absent API server, blocked YouTube embed, optional spelling upload helper missing.
- Worked: YouTube watch fallback message appears; spelling trainer remains usable.
- Confusing: optional/backend-dependent requests generate noisy failed requests in capture reports.
- Fixed tonight: no-query YouTube search no longer waits forever.
- Defer: reduce optional helper polling noise and make backend availability less chatty in dev captures.

