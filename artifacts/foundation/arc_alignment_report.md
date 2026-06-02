# arc.md Alignment Report

Classifies the `arc.md` strategic vision (1946 lines, 3 acts, 7 vehicle
chapters, 7 biological domains, many carry-forward systems + substrates) against
**runtime reality**. Status: documented / implemented / wired / playable /
accepted / missing / obsolete / deferred. **Runtime wins.** This sets honest
scope for the Completion Contract: the contract's "complete" = *every documented
act/chapter is a coherent playable slice*, not full fidelity to this vision.

## Live alignment dashboard (updated each phase transition — last: post Phase 1.6)
D=Documented, I=Implemented, W=Wired, P=Playable, A=Accepted (acceptance-covered).

| Category | D | I | W | P | A | Notes |
|---|---|---|---|---|---|---|
| **Act 1** | ✅ | ✅ | ✅ | ✅ | ✅ | engineering loop now gated + accepted |
| Acts 2–3 | ✅ | ❌ | ❌ | ❌ | ❌ | deferred design-only |
| Vehicle chapters (bike) | ✅ | ✅ | ✅ | ✅ | ✅ | bike only; ch.2–7 deferred |
| Region: Neighborhood | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Region: Dry Wash | ✅ | ⚠️ | ⚠️ | ⚠️ | — | discovery+bridge; region = Phase 1.8 |
| Region: Salt River | ✅ | ❌ | ❌ | ❌ | ❌ | Phase 2.4 |
| **Engineering: UTM/materials** | ✅ | ✅ | ✅ | ✅ | ✅ | per-material verdicts (1.2) |
| **Engineering: predict-before-test** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.3; accuracy tracked |
| **Engineering: inventory metadata** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.4 |
| **Engineering: quest gating / loop** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.5; loop observe→verify enforced |
| **Engineering: bridge construction** | ✅ | ✅ | ✅ | ✅ | ✅ | 1.6; designBridge choice→consequence (weak fails, safe succeeds) |
| Engineering: reasoning grader | ✅ | ❌ | ❌ | ❌ | ❌ | 1.7 (next) |
| **Ecology** | ✅ | ✅ (basic) | ✅ | ✅ | ✅ | observe 3 plants (1.1); loop = 2.1 |
| Discovery registry | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | 2.2 |
| World map | ✅ | ✅ (HUD) | ✅ | ⚠️ | ⚠️ | verify destinations 2.3 |
| **Language** | ✅ | ⚠️ metadata | ⚠️ | ⚠️ | — | revive 2.7 |
| **Economy** | ✅ | ❌ | ❌ | ❌ | ❌ | 2.8 |
| **Voice** | ✅ | ✅ (browser) | ✅ | ✅ | ⚠️ | neural disabled; 2.5/2.6 |
| Biology substrates / extra rigs | ✅ | ❌ | ❌ | ❌ | ❌ | deferred design-only |

**Doc↔playable gap trend:** shrinking — engineering systems (UTM/predict/
inventory/gating/ecology-basic) are now Implemented+Wired+Playable+Accepted.
Largest remaining near-term gaps: bridge interactivity (1.6), reasoning grader
(1.7), Dry Wash region (1.8), then ecology loop / discovery / world map (2.1–2.3).

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
