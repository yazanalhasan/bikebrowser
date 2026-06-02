# Legacy vs Rebuild — Final Recommendation

Synthesis of the 13 comparison docs in this folder (5 independent
evidence passes: source + dual-route Playwright + `npm run build` +
prior reality audit). Rule held: **reality > design docs; per-subsystem,
no global winner.**

## The two implementations, fairly stated
- **LEGACY** = `src/renderer/game/` (`/legacy-play`). ~53.7k LOC, 24
  scenes, 40+ systems. **Genuinely playable** — boots clean (0 console
  errors), 15/17 scenes render, ~13 biomes, a real **stress-strain UTM
  simulator**, a thermal lab, an **adaptive reasoning grader**
  (`CognitiveEngine.js`), an interactive **click-to-place bridge
  minigame**, an **e-bike** + 920-LOC sim engine, **economy/mining/
  foraging/crafting**, **world-map fast-travel**, ~54 quests, 6-region
  language mastery. **But rough and untestable:** WorldMap half-empty,
  2 blank scenes, HUD clutter, biology Stage 2/3 throw, **no acceptance
  pipeline / no completion oracle**, 724 kB bundle, many engines orphaned
  (built-but-unimported).
- **REBUILD** = `src/game/` (`/game-rebuild`). ~4.9k LOC, 7 scenes, 20
  systems. **Polished, coherent, completable, testable** — a fully-wired
  11-quest/32-objective Act-1 chain, the **only code-enforced learning
  loop** (evidence-gated bridge refuses untested/weak materials), **4
  finished animated characters**, a curated 16-card notebook, bilingual
  trust dialogue, a **complete acceptance pipeline** (Brain score 87.43,
  accepted), **174 kB bundle** (4.2× smaller, boots 1 scene). **But
  narrow:** single screen, no 2nd area, no economy, no enterable
  buildings, bike = 31-LOC stub, dead-end wider map, "predict-then-test"
  is theme-only.

## The dominant pattern (across all 13 docs)
**Rebuild owns the spine; Legacy owns the depth.** Rebuild wins
coherence, performance, art polish, acceptance/testability, and the one
enforced learning loop. Legacy wins breadth, biome variety, vehicle
variety, content volume, and the two deepest teaching tools (the
stress-strain UTM and the reasoning grader). The best-of-both matrix
landed **6 Keep Rebuild / 2 Keep Legacy / 9 Merge Both / 3 Replace** —
i.e. the answer is overwhelmingly *combine*, not *choose*.

## Phase 12 — Executive Recommendation

> **C. Hybridize — with the REBUILD as the canonical spine and the LEGACY
> as the parts bin.** Port the legacy's proven gems onto the rebuild's
> wired, testable, performant foundation, in the order set by
> `merge_roadmap.md`.

**Why not the alternatives (evidence):**
- **A. Continue rebuild (only):** rejected — discards a genuinely
  playable, content-rich world (13 biomes, ~54 quests, e-bike, economy,
  a real reasoning grader and stress-strain simulator). That is years of
  proven content the rebuild would have to re-create from scratch.
- **B. Revert to legacy:** rejected — the legacy has **no acceptance
  oracle, can't be cleanly tested**, is 4.2× heavier, visually rougher,
  and full of orphaned/stubbed engines. Shipping on it would lose the
  rebuild's polish, performance, and the only enforced learning loop.
- **D. Rebuild parts again:** rejected — wasteful; both implementations
  already exist. The work is *integration*, not re-creation.

**Why C is right:** the two implementations are **complementary, not
redundant**. The rebuild is the better *game* (completable, polished,
testable); the legacy is the better *engine + content library*. The
matrix shows nearly every contested subsystem is a "Merge Both" — keep
the rebuild's wiring/UX/acceptance and graft the legacy's depth behind
it. The acceptance pipeline is the **non-negotiable ratchet**: every
ported feature must pass it before it ships, which keeps the hybrid from
regressing into the legacy's untestable sprawl.

## The hybrid in one line
**Rebuild spine + Legacy gems, gated by the Rebuild's acceptance
pipeline, sequenced by `merge_roadmap.md`.**

## Top ported gems (priority, from the matrix + roadmap)
1. **Stress-strain UTM simulator** (legacy) behind the rebuild's wired UTM
   UX — turns the strong-but-shallow test loop into a deep one.
2. **Captured-hypothesis "predict-then-test"** step (the one thing
   *neither* has) — small, highest educational leverage.
3. **Adaptive reasoning grader** (`CognitiveEngine.js`) behind the
   rebuild's dialogue/notebook.
4. **Interactive click-to-place bridge** (legacy) onto the rebuild's
   evidence gate — adds the missing player choice/mastery.
5. **2–3 real biomes + world-map fast-travel** (legacy) to cure the
   rebuild's dead-end wider map.
6. **E-bike + economy/foraging** later (Phase 3) — breadth, once the
   spine is deep.

## What stays deferred (do NOT port yet)
The design-only spine (ethnobotany/phytochemistry/pharmacology/reasoning/
knowledge-state substrates, the Sonoran dataset, the 7-vehicle spine
beyond e-bike, genetics/terraforming) — unbuilt in BOTH trees; not part
of this hybrid until the spine is deep and proven.

## Guardrail
This audit changed nothing and merged nothing. The next step is to
execute `merge_roadmap.md` Phase 1 (quick wins) **through the rebuild's
acceptance pipeline** — and to finally **resolve the two-tree split**
(rebuild = canonical, legacy = sourced-from, not dual-shipped).

---
*Full evidence: the 13 comparison docs in this folder + the prior reality
audit in `artifacts/game_state/`.*
