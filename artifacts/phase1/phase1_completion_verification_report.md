# Phase 1 — Completion Verification Report

**Date:** 2026-06-02
**Build under test:** `/game-rebuild` (React `GameShell` → Phaser; canonical Act 1 runtime)
**Authoritative gate:** `tests/e2e/player-reachability.suite.spec.js` (strict; never uses `window.__GAME__` for the action under test)
**Principle:** *Implemented + Accepted ≠ Player Reachable.* Runtime truth wins. A system is "complete" only when a real player can do it by keyboard/mouse, and the loop delivers choice → consequence → payoff.

---

## 1. Verdict

**Phase 1 is verified complete and player-reachable.** Every Phase-1 player-facing
loop — reach the build, move/interact, predict-before-test, design the bridge,
investigate the washout, and the social (trust/Spanish) beat — is **independently
verified reachable by real keyboard/mouse play**, not self-asserted. The strict
suite, used as the pass/fail gate, has **zero remaining expected-fails**.

This verdict survived an adversarial reconciliation: running the strict suite as
the gate exposed **three real reachability defects** that feature-level specs had
missed. All three are fixed and re-verified (§4).

---

## 2. Verification model

Every player-facing system is held to **dual acceptance**, and the gate adds a third (future) layer:

| Layer | What it proves | Tooling |
|---|---|---|
| **Engine Acceptance** | the system's logic works (driving `__GAME__` is allowed) | `game-rebuild.act1-acceptance.spec.js` |
| **Player Reachability** (primary) | a real player can do it by keyboard, no `__GAME__` for the action | dedicated `*-reachability.spec.js` + strict suite GUARDs |
| **Payoff Acceptance** (in progress) | the player visibly receives choice → consequence → payoff | strict suite `PAYOFF` slot (currently `fixme`); first real payoff assertion lands with Phase 2.1 ecology |

---

## 3. Per-system verification (runtime truth)

| System | Phase / commit | Engine | Player Reachable (independent) | Fun |
|---|---|---|---|---|
| Reach build from Home | 1.9.1 `30708e4` | ✅ | ✅ GUARD (real Home click → /game-rebuild) | n/a |
| Movement + walk-up interactions | — | ✅ | ✅ (keyboard) | n/a |
| UTM material testing | 1.2 | ✅ | ✅ (overlay) | ✅ |
| **Predict-before-test** | 1.9.2 / 1.9.2A-C `45f4ac3`/`dbd5f93` | ✅ | ✅ GUARD (HOLD/BREAK + confidence; beam holds/bends/breaks; Esc-exit) | ✅ |
| **Bridge design (choice)** | 1.9.3 `142362b` (+`8932592`) | ✅ | ✅ GUARD (collect→test→design by keyboard; weak fails, sound holds) | ✅ |
| **Dry Wash investigation** | 1.9.4 `6110ad5` (+`8932592`) | ✅ | ✅ GUARD (observe→hypothesize→evidence→conclude; corrected-by-evidence) | ✅ |
| **Mrs. Ramirez trust / Spanish** | reconciliation `2525b26` | ✅ | ✅ GUARD (progression-aware zone; thank-you beat fires) | n/a (social) |
| Reasoning grader | 1.7 `8ef1447` | ✅ | ✅ (surfaces in predict payoff) | ✅ |
| Ecology observation | 1.1 | ✅ | ⚠️ **one auto-press; no predict/payoff** → **Phase 2.1** | ⚠️ → 2.1 |

**Strict suite result (authoritative):** `6 passed / 1 skipped / 0 expected-fail`
(the skip is the `PAYOFF` `fixme`). GUARDs: Home-reachable, UTM predict choice,
no-shadowed-zones + Ramirez thank-you, UTM exitable, bridge-by-hand, investigation-by-hand.

---

## 4. Defects found and fixed *during* verification

The value of the strict, no-`__GAME__` gate is that it found what optimistic "complete" claims hid:

1. **Bridge dead interaction** (`8932592`) — pressing E at the bridge workbench with
   no tested materials hit a silent `return`: no modal, no feedback. Fixed: opens an
   instructional "Test materials at the UTM first" panel; the interaction is always live.
2. **Investigation wrong door** (`8932592`) — the loop was reachable only via the new
   `investigate_wash` marker; the suite targeted the old `dry_wash` sign. Suite updated;
   GUARD now drives the real marker and asserts `concluded` + `correctedFromMisleading`.
3. **Mrs. Ramirez shadowed zone** (`2525b26`) — two interaction zones stacked at her exact
   coords, so "Thank Mrs. Ramirez" could never fire. Collapsed into one progression-aware
   zone; GUARD asserts the thank-you beat completes through play.

Each defect was found by running the gate against the rendered canvas, fixed at root
cause, and the corresponding worklist `test.fail` promoted to a passing GUARD.

---

## 5. Known remaining gaps (carried forward, not hidden)

- **Ecology** is the last Phase-1 loop without observe → predict → outcome → payoff (one
  auto-press today). It is the immediate next target: **Phase 2.1 Ecology Loop**.
- **Payoff Acceptance** is a `fixme` slot; the first real payoff assertion is delivered with ecology.
- **Phase 2 systems** (discovery registry, world map, multi-biome) remain `__GAME__`-only and untouched.

---

## 6. Sign-off

Phase 1's player-reachable engineering + investigation + social loops are **independently
verified** against runtime truth. The strict suite is the standing regression gate. Per the
owner's direction, the next authorized work is **Phase 2.1 Ecology Loop**, built to the same
pattern (Observe → Predict → Outcome → Payoff) and held to **three** acceptance layers
(Engine + Player Reachability + Payoff) before world expansion proceeds.
