# Acceptance Hardening — making the gate trustworthy for autonomous runs

The acceptance pipeline is now a **first-class production asset** — Executive
Brain will depend on it for long autonomous (overnight) sessions, so it must
be **more reliable than any individual gameplay feature.** This report
catalogs the remaining fragilities and the hardening plan. (The Path-A fix
already removed the dead-band navigation failure.)

## Brittle navigation assumptions
- **B1 (fixed):** the 24–28px walk dead band. Resolved in `walkTo`
  (`STEP < ARRIVE`).
- **B2 (open):** the walk still relies on coarse keyboard holds with
  time-based distance estimates (`|d|*2.0` ms). On a slow/loaded machine the
  player may overshoot. *Harden:* cap nudge size near the target and re-read
  position each iteration (already iterates; tighten the near-target step).

## Hardcoded coordinates
- **H1 (open, medium):** the bike step hardcodes `x:470, y:432`, duplicating
  the layout (`bike_inspection`). If the layout moves the bike, the literal
  goes stale (exactly the class of issue that triggered this failure).
  *Harden:* derive every target from `scene.interactions.zones` at runtime
  (the helper `interactionTarget` already does this for other steps — make
  step 1 use it too and delete the literal x/y).

## Fragile scene assumptions
- **S1 (open):** closely-spaced interaction zones (bike 470 vs neighbor 420 =
  50px) make "nearest-zone" arrival ambiguous. *Harden:* the runtime
  `interactions.nearest()` could prefer an *explicitly targeted* zone during
  scripted navigation, or expose a `scene.interactions.byId(id)` the test
  walks to precisely. Keeps gameplay unchanged; removes ambiguity.
- **S2 (open):** two `id:'neighbor'` zone registrations dedupe to one at
  runtime — benign today, but duplicate ids are a latent foot-gun.
  *Harden:* assert unique zone ids in a cheap test.

## Race conditions / ordering
- **R1 (open):** steps wait on `scene.prompt.visible && text.includes(...)`
  and on `__GAME__.getAct1State()` predicates — good. But `closeDialogue`
  presses Space up to 8× with 100ms waits; a slow dialogue could outlast it.
  *Harden:* wait on dialogue-closed state rather than a fixed loop count.
- **R2 (open):** `resetAct1()` then immediate screenshot — add a
  `waitForFunction` on a known reset-state flag before proceeding.

## Determinism for long autonomous runs
- **D1:** add Playwright **retries: 1** for the acceptance spec in CI/auto
  mode (a single retry absorbs true flakes without masking real regressions —
  a consistent 2/2 failure still fails). *Do not* use retries to hide
  determinism bugs; pair with the fixes above.
- **D2:** capture the trace/video on failure (already on) and surface the
  `error-context.md` to Executive Brain's stuck-detection so a red gate is
  diagnosed, not just retried.
- **D3:** make the Brain acceptance audit and the Playwright spec the **two
  required signals**; a green run = both. (Today both pass.)

## Priority for hardening (before heavy autonomous use)
1. **H1** — runtime-derive all walk targets (kills the stale-coordinate
   class). High value, low risk.
2. **S1** — `interactions.byId()` precise navigation. Medium.
3. **D1/D2** — retry+diagnosis wiring for autonomy. Medium.
4. **R1/R2, B2, S2** — robustness polish. Low.

## Principle
The acceptance system is treated like **source control, memory, and
governance**: it must not be weakened to pass, and a red gate **stops**
autonomous work (it does not get bypassed). Hardening = making it
*deterministic*, never *lenient*.
