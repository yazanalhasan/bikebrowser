# Documentation Corpus Index (STEP 0)

Inventory of the BikeBrowser `*.md` documentation corpus used as the
design/acceptance/reference layer. **151 markdown files** under `artifacts/` +
`docs/` (plus top-level + `arc.md`). Grouped by corpus; authoritative files
called out. **Standing rule: runtime reality > documentation.** All docs are
*reference / design intent*; the live game and the acceptance pipeline are the
source of truth. Where a doc conflicts with runtime, runtime wins and the
divergence is logged (`docs_vs_runtime_matrix.md`).

Source-of-truth tiers:
- **GATE** — authoritative and enforced (acceptance, governance, legacy lock).
- **CANON** — canonical design/architecture the build must respect.
- **REFERENCE** — accurate snapshots/reports; verify against runtime.
- **DESIGN-ONLY** — aspirational/future; largely not implemented; do not treat as reality.

## Groups

| Group (dir) | Files | Purpose | Source-of-truth | Notes / conflicts |
|---|---|---|---|---|
| `artifacts/foundation/` | 14 | Acceptance stabilization/hardening, golden baseline, canonical hybrid arch, legacy preservation (registry/gems/non-negotiables), governance flow + wiring, baseline audits | **GATE / CANON** | Highest authority. `golden_baseline.md`, `acceptance_*` = the ratchet. `legacy_preservation_registry.md`/`non_negotiable_legacy_features.md` = the lock. `canonical_hybrid_architecture.md` = rebuild-spine/legacy-parts-bin. `operational_wiring_*` + `governance_execution_flow.md` = governance operational status. |
| `artifacts/autonomy_readiness/` | 6 | Autonomy blockers/limiters, readiness score, repair plan, budget gap, governance preservation | **GATE** (autonomy policy) | Describes Executive Brain autonomy; budget/recovery now IMPLEMENTED (see governance_sprint). |
| `artifacts/autonomous_run/` | 4 | Tool registry (21 tools), tool-selection rules, recovery/escalation, overnight policy | **GATE** (tool/governance rules) | Governs autonomous tool use; voice added plan-only. |
| `artifacts/governance_sprint/` | 1 | R0 + Voice governance readiness scorecard | **GATE** | All 8 governance areas IMPLEMENTED; 436 tests. |
| `artifacts/budgets/` | 1 | Live budget envelope (fail-closed; $0 authorized) | **GATE** | Paid/heavy blocked by default. |
| `artifacts/voice/` | 11 | 10-phase voice infra audit + model provider audit + NPC registry | **CANON** (voice design) | Local-first recommendation; **generation disabled**; no TTS engine installed (Phase 2.5). |
| `artifacts/voice_governance/` | 1 | Voice Governance V1 readiness | **GATE** | `brain/voice/` wired, generation-disabled. |
| `artifacts/legacy_vs_rebuild/` | 14 | Comparative audit + `merge_roadmap.md` + `final_recommendation.md` + `best_of_both_worlds_matrix.md` | **CANON** | Authoritative for "rebuild = canonical spine, legacy = validated parts bin." Legacy = `src/renderer/game/`; rebuild = `src/game/`. |
| `artifacts/game_state/` | 16 | Evidence-based reality audit (state-of-the-game, playability, quest/educational/fun/technical-debt audits, `runtime_reality_audit.md`) | **REFERENCE** | 2026-06-02 early snapshot; verify vs live runtime (this pass refreshes it). |
| `artifacts/biology_audit/`, `artifacts/biology_next_phase/` | 11 | Biology/ecology substrate design, knowledge graph, quest taxonomy, living-systems roadmap, Sonoran dataset plan | **DESIGN-ONLY** | Aspirational future (Phase 2+). Mostly NOT implemented in rebuild. Do not treat as runtime. Informs Phase 1.1 ecology + Phase 2.1 ecology loop direction. |
| `artifacts/art_audit/`, `artifacts/asset_audit/`, `artifacts/scene_snapshots/`, `artifacts/playwright_audit/` | 6 | Character/visual audits, replacement plans, scene snapshots, Playwright postmortems | **REFERENCE** | Operational/diagnostic history. |
| `artifacts/full_game_pass/` | (new) | This pass: runtime walkthrough, docs-vs-runtime matrix, autonomous report | **REFERENCE** | Created by STEP 2/3/8. |
| `docs/` (top) | ~8 | `ARCHITECTURE.md`, `SYSTEM_AUDIT.md`, `AI_RESOURCE_ROUTING.md`, `BACKLOG.md`, `dev/quest_wiring_gate.md`, `game_art_visual_qa.md` | **CANON / REFERENCE** | `ARCHITECTURE.md` + `dev/quest_wiring_gate.md` relevant to Phase 1 quest gating. |
| `docs/game_rebuild/` | ~40 | Rebuild production reports: act1 master contract, art/audio pipelines, NPC identity matrix, ecology/chemistry embodiment, bridge/UTM execution, child-facing walkthroughs, visual validation | **CANON (design) / REFERENCE (reports)** | `act1_master_contract.md`, `final_npc_identity_matrix.md`, `audio_tts_architecture.md`, `ecology_chemistry_embodiment.md` = design canon. Many "final_*" are point-in-time reports. |
| `arc.md` (root) | 1 | Master narrative/curriculum/design vision (v2.0): bike→ebike→spacecraft progression, ethnobotany/biology substrates, quest taxonomy, reference models | **CANON (vision) / DESIGN-ONLY (most content)** | Long-horizon design intent. Most (spacecraft, biology substrates, multi-act) NOT implemented. Preserve intent; build the smallest clean slice. |
| Top-level repo `*.md` | ~17 | `README`, `SETUP`, `GETTING_STARTED`, `QUICKSTART`, `DEVELOPMENT`, `CLAUDE.md`, `AGENTS.md`, `STATUS`, `NEXT_STEPS`, `UX_SAFETY_*`, optimization guides, `DOCS_INDEX.md` | **REFERENCE** | Dev/setup/UX-safety reference. `UX_SAFETY_*` relevant to child-facing acceptance. |

## Authoritative files for this game pass (the working set)
- **Acceptance/baseline gate:** `foundation/golden_baseline.md`, `pre_phase1_acceptance_snapshot.md`, `acceptance_hardening.md`; spec `tests/e2e/game-rebuild.act1-acceptance.spec.js`.
- **Legacy lock:** `foundation/legacy_preservation_registry.md`, `non_negotiable_legacy_features.md`, `legacy_gems.md`.
- **Architecture canon:** `foundation/canonical_hybrid_architecture.md`, `legacy_vs_rebuild/merge_roadmap.md` + `final_recommendation.md`, `docs/ARCHITECTURE.md`, `docs/game_rebuild/act1_master_contract.md`.
- **Governance gates:** `governance_sprint/governance_readiness.md`, `foundation/operational_wiring_implementation_report.md`, `autonomous_run/tool_selection_rules.md`, `budgets/budget_status.md`.
- **Voice:** `voice/voice_architecture_recommendation.md`, `voice/npc_voice_registry.md`, `voice_governance/voice_governance_readiness.md` (generation disabled).
- **Ecology design (Phase 1.1/2.1):** `docs/game_rebuild/ecology_chemistry_embodiment.md`, `biology_next_phase/food_web_substrate.md` + `quest_taxonomy.md` (design-only).
- **Reality:** `game_state/runtime_reality_audit.md` + `playability_assessment.md` (verify vs live; refreshed by `full_game_pass/runtime_walkthrough.md`).

## Known doc↔runtime divergences (carried into the matrix)
1. **arc.md / biology_next_phase**: describe biology/ethnobotany substrates, spacecraft progression, multi-act world — **not implemented**. Design-only.
2. **Notebook "13→16"** framing in the roadmap assumed creosote/saguaro entries; runtime has 16 entries (none creosote/saguaro); the 13/16 gap is the Spanish/Arabic/trust path. (Resolved in Phase 1.1 ecology-first decision — see source-of-truth + matrix.)
3. **Voice**: docs describe a full local pipeline; runtime uses browser TTS only, EB voice generation disabled, no engine installed.
4. **game_state/ audits** are an early-2026-06-02 snapshot; live runtime is re-verified this pass.
