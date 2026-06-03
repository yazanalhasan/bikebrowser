# arc.md Alignment Report

Classifies the `arc.md` strategic vision (1946 lines, 3 acts, 7 vehicle
chapters, 7 biological domains, many carry-forward systems + substrates) against
**runtime reality**. Status: documented / implemented / wired / playable /
accepted / missing / obsolete / deferred. **Runtime wins.** This sets honest
scope for the Completion Contract: the contract's "complete" = *every documented
act/chapter is a coherent playable slice*, not full fidelity to this vision.

## Live alignment dashboard (updated each phase transition — last: post **Phase 2.1 Ecology Loop** — Phase 1 verified complete; Phase 2 in progress)
D=Documented, I=Implemented, W=Wired, P=Playable, A=Accepted (acceptance-covered).

| Category | D | I | W | P | A | Notes |
|---|---|---|---|---|---|---|
| **Act 1** | ✅ | ✅ | ✅ | ✅ | ✅ | engineering loop now gated + accepted |
| Acts 2–3 | ✅ | ❌ | ❌ | ❌ | ❌ | deferred design-only |
| Vehicle chapters (bike) | ✅ | ✅ | ✅ | ✅ | ✅ | bike only; ch.2–7 deferred |
| Region: Neighborhood | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Region: Dry Wash** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.8; first investigation region (observe→hypothesis→evidence→conclusion; misleading hypothesis disproved) |
| Region: Salt River | ✅ | ❌ | ❌ | ❌ | ❌ | Phase 2.4 |
| **Engineering: UTM/materials** | ✅ | ✅ | ✅ | ✅ | ✅ | per-material verdicts (1.2) |
| **Engineering: predict-before-test** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.3; accuracy tracked |
| **Engineering: inventory metadata** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.4 |
| **Engineering: quest gating / loop** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.5; loop observe→verify enforced |
| **Engineering: bridge construction** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.6; designBridge choice→consequence (weak fails, safe succeeds) |
| **Engineering: reasoning grader** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.7; learning system (rewards reasoning not correctness; wrong+corrected = strong) |
| **Ecology** | ✅ | ✅ | ✅ | ✅ | ✅ | observe 3 plants (1.1) + **Ecology Loop (2.1)** observe→predict→outcome→payoff, player-reachable + Fun, 3-layer accepted |
| Discovery registry | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | **2.2 in progress** |
| World map | ✅ | ✅ (HUD) | ✅ | ⚠️ | ⚠️ | verify destinations 2.3 |
| **Language** | ✅ | ⚠️ metadata | ⚠️ | ⚠️ | — | revive 2.7 |
| **Economy** | ✅ | ❌ | ❌ | ❌ | ❌ | 2.8 |
| **Voice** | ✅ | ✅ (browser) | ✅ | ✅ | ⚠️ | neural disabled; 2.5/2.6 |
| Biology substrates / extra rigs | ✅ | ❌ | ❌ | ❌ | ❌ | deferred design-only |

**Doc↔playable gap trend:** shrinking — engineering systems (UTM/predict/
inventory/gating/ecology-basic) are now Implemented+Wired+Playable+Accepted.
Largest remaining near-term gaps: bridge interactivity (1.6), reasoning grader
(1.7), Dry Wash region (1.8), then ecology loop / discovery / world map (2.1–2.3).

## Player Reachable (PR) + Fun status (the corrected truth; last: post **Phase 2.1 Ecology Loop** — Phase 1.9 complete + verified)
A QA audit (`qa_audit/player_reachability_audit.md`) proved **Implemented +
Accepted ≠ Player Reachable**: Phase-1 acceptance drove `window.__GAME__`
directly, so it validated the *engine*, not *player access*. PR = a real player
can do it via keyboard/mouse/UI, no debug API.

Standard (1.9): every player-facing system has **two** tests — Engine Acceptance
(`__GAME__` allowed) and **Player Reachability** (real input only, the primary
criterion). Not complete until a real player can do it.

**Independent verification (reconciliation, 2026-06-02):** the strict
`player-reachability.suite.spec.js` (the pass/fail gate; never `__GAME__` for the
action) was reconciled against runtime truth. It had still listed bridge +
investigation as worklist (`test.fail`) — true at the time it was written, stale
after 1.9.3/1.9.4. Running it exposed two real defects: the bridge workbench
**silently no-op'd** when no materials were tested, and the investigation was
only reachable via a new marker the suite didn't target. Both fixed (gating now
shows a feedback panel; suite drives the real marker). The two items are now
**GUARD** tests driving the entire keyboard path and pass — so bridge design and
investigation are independently verified player-reachable, not just self-asserted.

A third defect was then fixed: Mrs. Ramirez had two interaction zones stacked at
her exact coords, so "Thank Mrs. Ramirez" (spanish_trust + trust/Spanish) was
permanently shadowed. Collapsed into one progression-aware `neighbor` zone and
promoted that worklist item to a GUARD too. **The strict suite now has zero
remaining expected-fails: 6 GUARDs green / 1 payoff `fixme` skipped.** Every
Phase-1 player-facing loop is independently verified reachable by keyboard.

**Fun** (new, objective): does the player get **choice → consequence → payoff**
through the UI? Not a rating — a yes/no on whether those three are present in play.

| System | Impl | Accepted (engine) | **Player Reachable** | **Fun (choice→consequence→payoff)** | Note |
|---|---|---|---|---|---|
| Reach canonical build from Home | ✅ | ✅ | **✅ (1.9.1)** | n/a (navigation) | Home Play → /game-rebuild; real-click spec |
| Movement + walk-up interactions | ✅ | ✅ | ✅ | n/a | keyboard already |
| UTM material testing | ✅ | ✅ | **✅ (1.9.2)** | **✅** | overlay; per-material |
| **Predict-before-test** | ✅ | ✅ | **✅ (1.9.2)** | **✅ (1.9.2A-C)** | choice: HOLD/BREAK + how-sure · consequence: beam **holds/bends/breaks** on screen · payoff: ✓/✗ compare + run summary + reasoning credit; gates the UTM (arc.md); Esc-exit, never trapped |
| **Bridge design (choice)** | ✅ | ✅ | **✅ (1.9.3, verified)** | **✅ (1.9.3)** | overlay: pick a tested material per structural role (deck/support/brace) · consequence: weak design **sags red on screen**, sound design **holds green** · payoff: bridge stands + plan set + redesign-on-failure loop; gates on tested evidence with a **feedback panel** (no silent dead-end); Esc-exit, never trapped; **independently verified** by the strict suite GUARD (full keyboard play: collect→test→design, no `__GAME__`) + dedicated bridge-reachability spec |
| **Dry Wash investigation** | ✅ | ✅ | **✅ (1.9.4, verified)** | **✅ (1.9.4)** | overlay: walk to washout marker → press E · choice: pick 1 of 2 explanations (misleading one unmarked) · consequence: evidence **turns a wrong guess red + "doesn't fit"** on screen · payoff: real explanation + "you changed your mind with the evidence" + notebook; Esc-exit, never trapped; **independently verified** by the strict suite GUARD (full keyboard play, asserts concluded + corrected) + dedicated investigation-reachability spec |
| **Ecology loop (observe→predict→outcome→payoff)** | ✅ | ✅ | **✅ (2.1)** | **✅ (2.1)** | "Plant the desert" marker → **observe** a site (conditions) → **predict** which plant thrives (◀▶ + E) → **outcome**: the plant visibly **grows green (thrives)** or **wilts amber (struggles)** → **payoff**: why it fits + notebook field note; wrong-but-taught (names the plant that fits + why); Esc-exit, never trapped; **triple acceptance** — engine (`ecology-engine`) + player-reachability (`ecology-reachability`) + a strict-suite **Payoff GUARD** (asserts outcome resolved + notebook) |

**Bottleneck (resolved):** the gap was never implementation — it was **player
access to implementation.** Predict (1.9.2), Build/bridge (1.9.3),
Investigate (1.9.4) and now **Ecology (2.1)** are all player-reachable + Fun;
prediction gates intervention (arc.md). Phase 1 is verified complete (see
`phase1/phase1_completion_verification_report.md`). **Phase 2.1 Ecology Loop is
the first system held to the full three-layer standard — Engine + Player
Reachability + Payoff** — all green. Remaining Phase 2: 2.2 Discovery Registry,
2.3 World Map, 2.4 Multi-Biome (still `__GAME__`-only; next targets).

## Acts
| Act (arc.md) | Documented | Implemented | Playable | Accepted | Status |
|---|---|---|---|---|---|
| **Act 1 — Sonoran / Bike / Local Systems** | ✅ | ✅ (vertical slice) | ✅ | ✅ (green) | **PLAYABLE** — the canonical runtime |
| **Act 2 — Earth Expansion / Spacecraft Engineering** | ✅ | ❌ | ❌ | ❌ | **DEFERRED (design-only)** — needs a playable slice |
| **Act 3 — Alien Planet / Terraforming / Life Engineering** | ✅ | ❌ | ❌ | ❌ | **DEFERRED (design-only)** |

## Vehicle chapters (7-chapter mechanical spine)
Bike → eBike → … → Spacecraft. **Only the bike (Act 1) is implemented/playable.**
Chapters 2–7: DEFERRED (design-only). Contract target = a playable slice per
documented chapter (large multi-session scope; sequenced after Act 1 depth).

## Biological domains / substrates
Ecology, Ethnobotany, Phytochemistry, Pharmacology, Molecular/Cellular Biology,
Biology Workbench (observation-scale modes). **Status: DESIGN-ONLY** (arc.md +
`biology_next_phase/*`). Runtime has a **basic ecology observation** (Act 1,
mesquite/creosote/saguaro — Phase 1.1) only. The deeper substrates are deferred;
Phase 2.1 (ecology loop) is the first real step toward them.

## Carry-forward systems (arc.md §4)
| System | Runtime status | Phase |
|---|---|---|
| Construction System | implemented (bridge plan→repair) | enhance: Phase 1.6 |
| Materials Lab / UTM Rig | implemented (4 materials, tested) | deepen: Phase 1.2/1.3 |
| Ecology Substrate | basic (Phase 1.1) | deepen: Phase 2.1 |
| Foraging / Inventory | implemented (no metadata) | Phase 1.4 |
| Quest Engine | implemented (linear) | gate: Phase 1.5 |
| Knowledge State (notebook) | implemented (18 entries) | ongoing |
| Audio / Character Speech | browser TTS; neural disabled | Phase 2.5/2.6 |
| Language & Geography (7-region/6-language) | metadata only (rebuild) | Phase 2.7 |
| Thermal/Electrical/Fluid/Aero rigs, Biology Workbench | **MISSING** (design-only) | DEFERRED (Act 2+) |
| Discovery registry | partial (discovery map) | Phase 2.2 |
| World map | GPS HUD (verify destinations) | Phase 2.3 |
| Economy / Zuzubucks | legacy-only | Phase 2.8 |

## Regions
| Region | Status |
|---|---|
| Neighborhood (Act 1) | PLAYABLE |
| Dry Wash | discovery + bridge exist; full region DEFERRED (Phase 1.8) |
| Salt River | DEFERRED (Phase 2.4) |
| Earth-expansion / alien regions (Act 2/3) | DEFERRED (design-only) |

## Out-of-scope / obsolete (arc.md §7 + reality)
- Spacecraft fidelity, terraforming, full biology engineering, the 6-language
  pronunciation depth — **out of near-term scope**; treated as long-horizon
  vision, not Completion-Contract blockers.
- No content is "obsolete"; the vision is aspirational and preserved.

## Honest completion posture
- **Now:** Act 1 is a complete, accepted, playable educational slice; Phase 1 is
  deepening it into a real engineering loop (1.1 done).
- **Completion Contract** is satisfiable **incrementally**: Act 1 full → Dry Wash
  slice → Salt River slice → systems (predict/inventory/gating/bridge/reasoning/
  discovery/world-map/language/economy) → Act 2/3 as **playable slices** later.
- Acts 2–3 and the biology/vehicle spines are **deferred design**, surfaced here
  so "complete" is measured against *playable coherence per documented act*, not
  full vision fidelity. Each becomes a sequenced milestone; none is silently
  dropped.
