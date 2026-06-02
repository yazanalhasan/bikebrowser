# Current Source of Truth (STEP 1)

The authoritative synthesis the autonomous game pass builds against. Derived
from the documentation corpus (`documentation_corpus_index.md`) and reconciled
to runtime reality. **Precedence: runtime reality > documentation.**

## Standing invariants (non-negotiable)
- **Rebuild = canonical playable spine.** `src/game/` (route `/game-rebuild`) is
  the product. All Phase 1/2 gameplay lands here.
- **Legacy = validated parts bin.** `src/renderer/game/` (route `/legacy-play`)
  is a source of proven mechanics to **port**, never the canonical runtime. Never
  delete/regress preserved legacy features (`legacy_preservation_registry.md`:
  25 subsystems, 10 non-negotiables, 0 REMOVE).
- **Runtime evidence > documentation.** If a doc disagrees with the live game,
  the live game wins; preserve design intent; pick the smallest clean milestone;
  document the divergence; continue.
- **Acceptance pipeline = non-negotiable gate.** Green = Playwright
  `game-rebuild.act1-acceptance` PASS **and** Brain audit PASS, fresh evidence.
  Never weaken assertions/coverage/thresholds. A red gate stops promotion.
- **Governance must remain operational.** Mission scoring, tool governance,
  budget/resource, recovery, lessons, asset promotion, privilege, checkpoint —
  all wired (Phase 0.8) and must keep firing. Don't bypass.
- **No mass asset/content generation yet.** No TTS engine install, no batch art,
  no paid/cloud gen. Free-local work only until budgets + Phase 2.5/2.10 gates.

## Canonical architecture
- Phaser rebuild, single Act-1 scene (`NeighborhoodScene`) orchestrated by
  `Act1RuntimeSystem` (11 systems: quest, notebook, inventory, materials/UTM,
  construction, ecology, chemistry, discovery/map, trust, language, audio).
- Hybrid plan (`canonical_hybrid_architecture.md` + `merge_roadmap.md`): rebuild
  spine + selectively ported legacy gems (ecology/language/economy/world-map),
  each ported as a bounded slice behind acceptance.
- Data-driven Act-1 content under `src/game/data/act1/*` (quests, notebook,
  ecology, materials, dialogue, locations, map regions, chemistry, characters).

## Phase 1 goals (educational vignette → playable engineering game)
Loop the player can run repeatedly: **Observe → Predict → Test → Build → Verify.**
Per-item, isolated (own branch/commit/acceptance/screenshots/report; no
bundling): 1.1 ecology completion · 1.2 real per-material UTM (player can fail)
· 1.3 predict-before-test · 1.4 inventory metadata · 1.5 quest gating
(observe/predict/test/build/verify, no skipping) · 1.6 bridge construction V1
(interactive placement; outcome depends on design) · 1.7 reasoning grader
(grade reasoning+evidence, not the answer) · 1.8 Dry Wash region (one region:
one engineering + one ecology + one mystery).

## Phase 2 goals (living-systems depth, not more content)
2.1 ecology loop (observe→predict→outcome) · 2.2 discovery registry (permanent)
· 2.3 real world map (no fake destinations) · 2.4 three biomes only
(Neighborhood, Dry Wash, Salt River; each: engineering+ecology+education) · 2.5
local voice runtime (install XTTS-v2+Piper on GPU1, sample lines, validation +
acceptance + cultural review) · 2.6 voice integration (manifest→registry→
dialogue; cached only; browser TTS fallback; no gameplay-time gen) · 2.7
language learning revival (vocabulary/mastery/pronunciation/region; en/es/ar) ·
2.8 economy foundation (buy/sell/trade only; Zuzubucks) · 2.9 asset pipeline
operationalization (staging→validation→acceptance→promotion for all assets) ·
2.10 overnight autonomous build authorization (gated on acceptance+governance+
wiring+voice validation).

## Visual design rules (`docs/game_rebuild/*`, `arc.md`, art audits)
- Readability beats realism: a child identifies object/goal/next-step/reward in
  ~3s. Repair states read by shape/silhouette, not color alone. Modular part
  graphs, not single hero meshes. Six asset functions (explore/interact/inspect/
  repair/simulate/educate). No placeholder/junk in production (asset promotion
  gate). Preserve collision/interaction ids/quest flow on any visual change.

## World design rules
- Build ONE region at a time (1.8 Dry Wash; 2.4 caps at three biomes). No world
  expansion / no ten biomes. World map shows real current/future/locked areas —
  **no fake destinations**. New region must be visible from Act 1, unlockable,
  and carry one engineering + one ecology + one mystery.

## Governance rules (operational, must keep firing)
- Every autonomous work package: Mission Value Scoring (defer low-value/high-
  cost + paid/heavy) → Tool Governance (cheapest deterministic; paid/heavy
  blocked w/o budget) → Privilege (fail-closed) → Budget/Resource (fail-closed)
  → Execution → RecoveryGuard (2-fail → consult → stop; no infinite retry) →
  Acceptance → Asset Promotion (if assets) → Checkpoint → Lessons Learned.
- A blocked gate ⇒ defer that task, continue with the next safe one.

## Voice rules
- Local-first, offline pre-bake, cached; browser TTS fallback; MiniMax only for
  paid cinematic exceptions (blocked until budget). **Generation disabled**
  (`VOICE_GENERATION_ENABLED=False`); no engine installed until Phase 2.5.
  Arabic/Spanish voices require human CARE cultural review before generation.

## Acceptance rules
- Dual signal (Playwright + Brain audit), fresh evidence, screenshots. Every
  sub-phase keeps the gate GREEN and improves ≥1 measured dimension without
  regressing others. Coverage may be *strengthened* (new assertions), never
  weakened. Compare against `baseline_pre_phase1` (Brain min ≥ 80; Playwright 3/3).

## Tool usage rules
- Free/deterministic before paid/generative. Aseprite-from-source before
  ComfyUI/MiniMax. Python/Codex for code; Playwright for player-visible checks;
  Git safe ops (no force/push/merge-to-main autonomously). Consult procedural
  memory; record lessons. Respect the legacy registry before touching shared
  features.

## Key runtime-grounded corrections (design intent preserved)
- **Notebook**: 16 entries, none creosote/saguaro; 13/16 walkthrough gap =
  spanish/arabic/trust. Ecology creosote/saguaro are unwired quest objectives.
  **Phase 1.1 = ecology-first**: wire creosote+saguaro observations, add their
  notebook entries (Ecology), complete `desert_helper`, extend acceptance — a
  clean single concern serving Phase 2.1; spanish/arabic/trust completion stays
  with the language/trust phase.
- **Biology/ethnobotany substrates, spacecraft, multi-act** (arc.md / biology_*)
  are DESIGN-ONLY; not built. Build the smallest clean slice that honors intent.
- **Voice** is browser-TTS at runtime; neural/local pipeline is governed-but-
  disabled.
