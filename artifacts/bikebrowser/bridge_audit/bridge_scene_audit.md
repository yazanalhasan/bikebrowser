# Bridge-Building Scene — Complete Audit (Executive Brain)

**Read-only audit. No code changed.** Scope: `BridgeDesignScene.js`,
`ConstructionSystem.designBridge`, `Act1RuntimeSystem.designBridge`,
`act1BridgeFamilies.js`, and the live behavior captured by an automated EB
playthrough (screenshots in this folder: `01_family` → `04_result`).

User report: *"it is not playable, we just click through."* This audit confirms
the report, identifies the root cause, and proposes fixes **without implementing
them**.

---

## 1. What the scene actually is
A richer system than the report implies. Entry: in the neighborhood, the
`bridge_plan` interaction emits `bridgeDesign:start` (only reachable after the
player has tested materials at the UTM; otherwise a "blocked" screen sends them
back). Phases: `family → choose/ready (truss)` **or** `dv_wood → dv_build →
dv_ready (Da Vinci) → result`.

Two playable bridge **families** (4 more declared but `status:'soon'`):
- **Truss** — seat a tested material into 5 roles (deck/support/brace/cable/
  foundation) on glowing slots; keyboard (◀▶ pick, R rotate, E place, ⌫ remove)
  **and** mouse drag-drop.
- **Da Vinci** — a 7-beam self-supporting interlocking arch; beams must be seated
  bottom-up (each slot has `supportedBy`) at the right angle (±12°) or the arch is
  "floating" and collapses.

**Solver** (`ConstructionSystem.designBridge`) is **purely material-driven**: every
role must hold a material that was UTM-tested *and* `bridgeSafe`. All-safe → holds;
any unsafe load-bearing role → unsafe/collapse. The UI owns geometry; the solver
owns materials. Truss rotation is **not** read by the solver.

## 2. Empirical playthrough (EB drove it)
Setup: collected + tested all 8 materials (balsa/brick/concrete = unsafe;
pine/bamboo/iron/steel/carbon_fiber = safe). Opened the scene, picked Truss, then
**pressed E six times** (the way a player advances dialogue everywhere else).

Result, step by step (from `__BRIDGE_DESIGN__`):
- Held candidate defaulted to **index 0 = balsa** (UNSAFE) and never changed.
- Each E **placed balsa into the next slot** — deck, support, brace, cable,
  foundation — with no objection.
- Reached `ready` with `selection = {all five roles: "balsa"}`.
- One more E → **`outcome: "collapse"`** — "the deck failed… the bridge would
  collapse." (`04_result.png`.)

**So: mashing E builds an all-balsa bridge out of a material the player already saw
snap at the UTM, and it collapses — with zero friction along the way.**

## 3. Root cause of "we just click through"
A combination of design gaps, in order of impact:

1. **`E` is overloaded against the player's muscle memory.** Everywhere else in the
   game `E` = "advance / continue / read on." Here `E` = "place the currently-held
   material into the next slot." A player pressing E to "continue" **auto-assembles
   the entire bridge without ever deciding anything** — the literal "click through."
2. **The held material defaults to candidate index 0 and is sticky.** Index 0 is
   the first tested material (here balsa). Nothing nudges the player to *change* the
   held part per slot, so the default path is "same material in all five slots."
3. **No real decision is forced.** Any material goes in any slot; **unsafe materials
   are accepted** (only a soft warning — "it still counts"); **rotation is cosmetic**
   (truss solver ignores angle). The only thing that matters is "are all five
   materials safe?", and that single yes/no is the whole puzzle.
4. **The answer is pre-printed on the pieces.** Each tray piece is labelled
   `✓ held` / `✗ snapped`. Combined with #3, the "puzzle" reduces to "put green-
   labelled parts in slots" — no reasoning, no spatial thinking, no tension.
5. **Roles carry no material constraint.** Cable should want tension-strong, deck
   wants stiffness, foundation wants compression — but every role validates against
   the same `bridgeSafe` flag, so role identity (the actual engineering lesson) is
   decorative.

Net: the scene *renders* like a hands-on builder but *plays* like a 5-press
conveyor belt. It is interactive but not **meaningfully interactive**.

## 4. Truss vs Da Vinci (important asymmetry)
The **Da Vinci** mode is the counter-example that proves the gap: it gates on
**geometry** (support order + interlock angle) entirely in the UI before the solver
is consulted — a wrong angle or a floating beam visibly collapses. That mode has a
real failure space and teaches load transfer. **The Truss mode — the one in the
user's screenshot — has had its geometry challenge stripped to cosmetics**, leaving
only the material check. Whatever made Truss feel hollow, Da Vinci mostly avoids.
(Caveat: this audit playthrough exercised Truss end-to-end; a Da Vinci playthrough
should be run to confirm its interlock gating *feels* as real as it reads.)

## 5. Issue register (severity-ranked)
| # | Severity | Issue | Evidence |
|---|---|---|---|
| 1 | **High** | `E`=place collides with game-wide `E`=advance → players auto-build by reflex | playthrough: 6×E built all-5 slots |
| 2 | **High** | Held material is sticky/default-index-0 → "same material everywhere" is the path of least resistance | selection ended `{all: balsa}` |
| 3 | **High** | Unsafe materials freely placeable; only a soft warning | balsa (✗ snapped) filled every role |
| 4 | Med | Truss rotation is cosmetic (solver ignores angle) — `R` teaches nothing | solver reads only `bridgeSafe` |
| 5 | Med | No per-role material constraint → role identity (tension/compression) is decorative | all roles check same flag |
| 6 | Med | Answer pre-printed (`✓ held`/`✗ snapped`) removes the decision | `_makePiece` verdict label |
| 7 | Low | 4 of 6 families are `soon` — selector front-loads unavailable choices | `act1BridgeFamilies.js` |
| 8 | Low | Collapse on an all-default build can feel like a "gotcha" with no guidance to retry smarter | result screen → rebuild |

## 6. Recommendations (PROPOSALS — not implemented)
Aim: make the Truss build a genuine *decision* without adding systems (freeze-safe).
- **Separate "advance" from "place."** Don't let a bare `E` dump the held part. Options:
  require the player to *pick* a part (◀▶ or click/drag) before `E` commits, or make
  the primary commit drag-only with `E` reserved for confirm — so reflex-pressing
  can't build the bridge. (Highest impact, addresses #1/#2.)
- **Make role choice matter.** Score each role by the property it needs (deck→stiffness,
  cable→tension, foundation→compression, support→strength) instead of a single
  `bridgeSafe` flag, so "steel everywhere" isn't automatically optimal and the
  engineering lesson becomes the gameplay. (Addresses #5/#6; touches the solver —
  bigger change, design first.)
- **Let unsafe placement have teeth or be blocked with a reason.** Either refuse an
  unsafe part with a one-line "why," or let it through but make the *role* it fails
  visible pre-test. (Addresses #3.)
- **Make truss rotation real or remove it.** Either feed angle into a stability score
  (triangles vs rectangles — the family's stated concept) or drop `R` from truss so
  it doesn't imply meaning it lacks. (Addresses #4.)
- **Trim the family selector** to the two ready families (or clearly defer the rest)
  so the first choice isn't four dead ends. (Addresses #7.)
- **Confirm Da Vinci feels real** via a playthrough; if it does, consider it the
  template for what Truss should aspire to.

## 7. What is NOT broken
- The scene is **wired and responsive** (keyboard + mouse), exits cleanly on Esc,
  publishes a complete `__BRIDGE_DESIGN__` state, and the solver + load-test handoff
  (`loadTest:start`) work. The gating (need tested materials first) is correct.
- This is a **design-depth** problem, not a bug. Nothing crashes; the experience is
  just hollow on the Truss path.

## 8. Scope / governance note
Recommendations in §6 range from freeze-safe UX tweaks (separate advance/place; trim
selector) to a **solver/design change** (per-role property scoring) that is a real
gameplay change — that one needs an explicit design decision before any edit, since
Act 1 is scope-frozen. **No changes have been made.** Awaiting direction on which
recommendations to pursue.
