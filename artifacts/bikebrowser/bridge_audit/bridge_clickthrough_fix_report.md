# Bridge Click-Through Fix — Phase 1 Report (Executive Brain)

Freeze-safe fix for the audited "press-E-to-auto-build" problem. UX/input only —
no new engine, no solver change, no gameplay redesign.

## Files changed
| File | Change |
|---|---|
| `src/game/phaser/scenes/BridgeDesignScene.js` | Truss placement now requires an explicit per-slot material choice; `E` no longer auto-places; clearer prompts; mouse click-to-select parity |
| `tests/e2e/game-rebuild.bridge-anticlickthrough.spec.js` | **new** — acceptance test for the fix |

## The fix (mechanism)
The root cause was a sticky default: the "held" material defaulted to candidate 0
(balsa) and stayed held, so a bare `E` (which means *advance/continue* everywhere
else in the game) placed it into the next slot — five reflex presses built a
bridge.

Change: **the player is now empty-handed by default and after every placement.**
- `heldIdx` starts `null` and is reset to `null` after each `_place`.
- A bare `E`/`Space`/`R` with nothing held does **not** place — it calls
  `_promptPickFirst`: *"Choose a material first: ◀ ▶ (or click / drag a part),
  then E to place it into <SLOT>."* (with an error cue + a tray-label pulse).
- To place, the player must first **pick** a material: `◀ ▶` (keyboard),
  **click** a tray part (new pointer-up select), or **drag** it (unchanged).
- Drag vs click is disambiguated with a `_dragStarted` flag so the two don't fight.

This makes each of the five roles a deliberate choice, and makes reflex-pressing
inert — exactly the audit's #1 and #2 issues.

## Prompts / UI (requirement 4 & 8)
- **Choose material** (empty-handed): `Slot: DECK — the roadway you ride across.  Pick a material:  ◀ ▶  (or click / drag a part).`
- **Holding** a part: `Holding Steel.  Press E to place it into DECK.  ◀ ▶ to change.`
- **Unsafe warning** (requirement 9): when the held part failed the UTM, the same
  line shows `⚠ it snapped at the UTM — likely to fail` *before* the player commits.
- **Controls line:** `1) ◀ ▶ choose material   2) E place into slot   ·   R rotate   ⌫ remove   Esc leave`
- **Tray label:** `Tested parts — pick one (◀ ▶ or click/drag), then place it`
- **Test:** unchanged (`TEST BRIDGE` button pulses when ready; `E`/Enter/click).

## Behavior — before vs after
| | Before | After |
|---|---|---|
| Open Truss, mash `E` ×6 | balsa placed in all 5 slots → `ready` → **collapse** | nothing placed; stays in `choose`; prompt repeats "pick a material first" |
| Default held material | candidate 0 (balsa, unsafe), sticky | none — empty-handed each slot |
| Place a part | one `E` (reflex) | **pick** (◀▶/click/drag) **then** `E`/drop |
| Unsafe part | warned only after placing | warned on the held-preview *before* placing |
| Drag-to-slot | worked | still works (unchanged) |
| Sound design holds / weak fails | yes (solver) | yes (solver unchanged) |

Screenshots: `05_after_empty_handed.png` (the "pick a material" prompt on DECK),
`06_after_holding.png` (the "press E to place" prompt after picking).

## Validation evidence (all green)
- `npm run build` — clean.
- **Playwright smoke** (`game-rebuild.smoke.spec.js`) — pass.
- **Bridge reachability** (`game-rebuild.bridge-reachability.spec.js`, 2 tests) —
  pass (intentional keyboard build still works; weak fails, sound holds; Escape
  exits). Unchanged test file — it already did intentional `◀▶`-then-`E` placement,
  so the new flow validates it.
- **Anti-clickthrough** (`game-rebuild.bridge-anticlickthrough.spec.js`, **new**, 2 tests) — pass:
  - *mashing E (×14, E+Space) with nothing chosen* → `selection` empty, no zone
    filled, phase still `choose`, `candidateId` null. **Cannot auto-build.**
  - *intentional pick-then-place* → weak design (balsa support) `outcome !== safe`;
    rebuilt sound design `outcome === safe`; overlay exits (`active === false`) and
    the bridge plan is recorded (success chains into the load-test sim).

Required-test checklist:
- ✅ pressing E repeatedly does not auto-complete the bridge
- ✅ intentional placement still works
- ✅ a sound design can still pass
- ✅ a weak design still fails
- ✅ bridge scene exits cleanly

## Scope / governance
Input + copy only; solver, data, and progression untouched; fully reversible.
Keyboard accessibility preserved (◀▶ + E); drag/drop preserved; new click-to-select
added. Freeze-safe (a playability bug fix, not a gameplay redesign). Deeper truss
depth (role-specific material logic, rotation meaning, label leakage) is **Phase 2**
— proposed separately, not implemented.
