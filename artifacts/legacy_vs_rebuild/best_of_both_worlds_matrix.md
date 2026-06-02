# Best-of-Both-Worlds Matrix (Phase 10) — Legacy vs Rebuild

**Date:** 2026-06-02 · **Method:** Per-subsystem decision drawn from the Phase 1-9 evidence in this
folder + `artifacts/game_state/`, code re-verified where load-bearing. **Reality > design docs.**

**This is a roadmap input — no code is merged or deleted here.** Each row picks one disposition with a
one-line, evidence-backed justification.

**Decision legend**
- **Keep Rebuild** — the rebuild's version is the one to ship; legacy adds nothing worth the cost.
- **Keep Legacy** — the legacy version is the better artifact; adopt it as-is (caveats noted).
- **Merge Both** — take the rebuild's wiring/coherence/acceptance and graft legacy's depth onto it
  (the dominant pattern: *rebuild spine + legacy gem*).
- **Replace Entirely** — neither version is adequate to ship; rebuild fresh on the rebuild spine.

**Governing principle (from Phase 9 + Executive Summary):** the **rebuild is the canonical spine**
(it ships, it's wired, it's acceptance-scored, it's 4× lighter). Legacy is the **parts bin** of
high-ceiling teaching tools and world breadth — most "Merge Both" rows mean *port the reachable legacy
gem onto the rebuild's wired/acceptance-gated backbone*, not the reverse.

---

| # | Subsystem | Decision | One-line justification (evidence) |
|---|---|---|---|
| 1 | **Quest engine** | **Merge Both** | Keep rebuild's coherent completable `next`-chained spine (`gameplay §2`) but adopt legacy's **enforced typed steps** (`use_item`/`quiz`/`observe` gates, `questSystem.js:174-226`) so objectives actually gate, not just track. |
| 2 | **NPC system** | **Merge Both** | Keep rebuild's 4 final animated, fully-wired characters (`act1Characters.js`); selectively layer legacy's **personality/trust archetypes** (`npcLanguageSystem.js:24-60`, `correctsMistakes`/`patienceLevel`) for adaptivity. |
| 3 | **Dialogue** | **Keep Rebuild** | Rebuild's 13 hand-authored, voice-ready, state-firing entries are the shippable craft; legacy's 815 LOC are template-generated, partly unreachable, adaptivity unverified (`content §3`). Defer legacy adaptivity as a later enrichment. |
| 4 | **Inventory** | **Merge Both** | Rebuild's `Set` of ids is too thin to support crafting/economy; adopt legacy's **metadata + quantities + removal** (`inventorySystem.js:11-52`) but keep it wired the rebuild way. |
| 5 | **Notebook / learning artifact** | **Keep Rebuild** | Rebuild's curated 16-entry Field Notebook is its signature content + progress meter; legacy has only a scattered knowledge-concept/explainer system (`content §7`, `system §9`). |
| 6 | **Materials lab / UTM** | **Merge Both** ★ | Keep rebuild's wired-into-the-chain UTM, but **port legacy's real stress-strain physics** (`materialTestingEngine.js` 379 LOC, yield/ultimate/fracture, ASTM/USDA refs) behind it — the rebuild's 5-prop average is too shallow to teach *why* materials fail (`educational §3`). |
| 7 | **Construction / bridge** | **Merge Both** ★ | Keep rebuild's **evidence-gate** (`completeBridgePlan` refuses untested/weak materials — the only code-enforced loop, verified) and graft legacy's **interactive place-each-beam** minigame (`constructionSystem.js` 559 / `DryWashScene.js` 604) so the player *builds* the design their evidence justified (`gameplay §8`). |
| 8 | **Ecology** | **Merge Both** | Keep rebuild's observation/field-guide UX + notebook integration; pull legacy's **richer flora/fauna dataset** (12 flora + 9 fauna, predator-prey) and *optionally* its dynamic engine — but note legacy's `ecologyTicker` is a time-of-day visual fade, not a true food-web sim (`roadmap_reconciliation §4`). |
| 9 | **Biology** | **Replace Entirely** (defer) | Legacy Stage-1 is **orphaned**, Stage 2/3 **throw** (`biology/index.js:158-255`); rebuild has none. Neither ships. Build fresh on the rebuild spine *only after* the proven loop justifies it — defer per Executive Summary. |
| 10 | **Chemistry** | **Merge Both** | Keep rebuild's wired mix→dry→test UX; replace its 2 canned-string recipes with legacy's **multi-reagent property model** (`chemistrySystem.js` 437) to give it real variables/failure (`educational §6`). |
| 11 | **Reasoning** | **Keep Legacy** (port to spine) | The rebuild has **no reasoning evaluation** at all; legacy's `CognitiveEngine.js` (elicit-and-grade, 5 puzzle types, difficulty adaptation, verified 101 LOC) is the only thing that *tests* a child's reasoning — adopt it and wire it onto the rebuild chain (`educational §1`). |
| 12 | **Vehicle / bike / e-bike** | **Replace Entirely** (defer) | Rebuild bike = 31-LOC two-boolean stub (verified); legacy's e-bike/sim graph is real (`ebikeSystem.js` 160 + `simulationEngine.js` 928) but has **0 external imports** — orphaned. Neither is shippable; build a real bike-component model on the spine when the loop earns it, reusing legacy `BIKE_PARTS` data (`gameplay §7`). |
| 13 | **Exploration / scenes / biomes** | **Merge Both** | Rebuild's single screen is a hard ceiling on "there is a world here"; **port 2-3 of legacy's reachable biomes** (DryWash, CopperMine, LakeEdge — each renders real content) onto the rebuild's scene model as real second/third areas (`legacy_runtime §3`, `visual §5`). |
| 14 | **World-map / navigation** | **Replace Entirely** | Rebuild's `WorldMapScene.js` is a **5-LOC dead-end stub** (verified) and legacy's renders half-empty/order-sensitive (`legacy_runtime §5`). Build one real fast-travel map on the rebuild spine, reusing legacy's node/`unlockReq` *design* as reference. |
| 15 | **Economy / crafting / foraging / mining** | **Keep Legacy** (port to spine) | Rebuild has **none**; legacy ships Zuzubucks + shop + reputation + foraging/mining/crafting (`gameplay §3`, `system §7`). Adopt selectively as the metagame layer — but note `factorySystem`/`craftingSystem` are partly orphaned and need re-wiring. |
| 16 | **Language / heritage** | **Merge Both** | Keep rebuild's warm relationship-based bilingual trust (`TrustSystem.js` + `LanguageSystem.js`); layer legacy's **6-region progression + coach** (`languages.js`, `languageProgressionSystem.js` 318) for depth without losing the non-quiz tone (`content §6`). |
| 17 | **Save / state** | **Merge Both** | Keep rebuild's clean `getState`/`loadState` per-system pattern (verified in `ConstructionSystem.js:64-80`); extend the schema to carry legacy's breadth (inventory/currency/reputation/unlocks) as those systems land. |
| 18 | **Acceptance pipeline** | **Keep Rebuild** ★ | Rebuild has a scripted player-visible walkthrough + hard assertions + Brain score **87.43/accepted**; legacy has **none** and cannot be cleanly acceptance-tested (no completion oracle / readable coords / interactable registry) — this is the rebuild's single biggest structural asset (`acceptance_comparison.md`). |
| 19 | **Art pipeline** | **Keep Rebuild** | Rebuild's tiered provenance `AssetRegistry.js` (368) + `PLACEHOLDER_ASSET_CONTRACT` + `CharacterArtAuditBridge.js` + 4 final characters is disciplined/auditable; legacy mixes Aseprite + in-code Graphics + emoji with no registry (`system §11`, `visual §4`). |
| 20 | **Performance / bundle** | **Keep Rebuild** | Rebuild wins every measured axis — game chunk 174 kB vs 724 kB, 1 scene vs 21, smaller heap, trivial update loop (`performance_comparison.md`). Any ported legacy gem must be budgeted against this. |

★ = the four highest-leverage rows (UTM physics, construction merge, reasoning grader, acceptance pipeline).

---

## Tally & reading

- **Keep Rebuild:** 6 (Dialogue, Notebook, Acceptance, Art, Performance, +) — the rebuild's *delivery
  and polish* assets are kept wholesale.
- **Keep Legacy (port to spine):** 2 (Reasoning, Economy/crafting/foraging) — pure breadth the rebuild
  entirely lacks.
- **Merge Both:** 9 (Quest, NPC, Inventory, UTM, Construction, Ecology, Chemistry, Exploration,
  Language, Save) — the dominant pattern: **rebuild wiring + legacy depth.**
- **Replace Entirely:** 3 (Biology, Vehicle, World-map) — where *neither* version ships, two of them
  deferred until the proven loop justifies the build.

**Headline:** the rebuild keeps everything about **how the game is delivered** (acceptance, art,
performance, dialogue craft, notebook); legacy contributes everything about **how much the game
teaches and how big its world is** (stress-strain physics, reasoning grader, interactive construction,
economy, biomes). The three "Replace Entirely" rows (biology, vehicle, world-map) are the honest
admission that the most-hyped systems are *unshipped in both trees* and should be (re)built on the
rebuild spine, not salvaged.
