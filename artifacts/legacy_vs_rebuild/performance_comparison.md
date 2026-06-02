# BikeBrowser — Performance Comparison (Phase 8)

**Method:** Mix of **measured** and **reasoned-from-architecture**. Bundle sizes are **measured** from a
real `npm run build` (`vite build`, built in 9.76s, output in `build/assets/`). Route HTTP timings are
**measured** with `curl` against the live dev server (`127.0.0.1:5173`). FPS, runtime memory, and
in-scene responsiveness are **reasoned** from scene/system architecture (no profiler run). Every claim
below is tagged **[MEASURED]** or **[ESTIMATED]**. Both routes are HTTP 200 live.

**Date:** 2026-06-02

---

## 1. Bundle size — [MEASURED, production build]

The two trees are separate `lazy()` route chunks sharing one `vendor-phaser` chunk.

| Chunk | Raw | gzip | Tree |
|---|---|---|---|
| `GamePage-*.js` | **724.47 kB** | 206.56 kB | **LEGACY** route entry |
| `GameRebuildPage-*.js` | **174.16 kB** | 66.50 kB | **REBUILD** route entry |
| `vendor-phaser-*.js` | 1,478.41 kB | 339.65 kB | shared by both |
| `index-*.js` (app shell) | 65.46 kB | 21.26 kB | shared |
| `vendor-router-*.js` | 164.18 kB | 53.45 kB | shared |

**Per-route first load (entry + phaser + shell + router), gzip:**

- **REBUILD:** 66.50 + 339.65 + 21.26 + 53.45 ≈ **~481 kB gzip** (~1.88 MB raw).
- **LEGACY:** 206.56 + 339.65 + 21.26 + 53.45 ≈ **~621 kB gzip** (~2.43 MB raw).

**Game-code delta (excludes shared phaser/shell):** legacy game chunk is **724 kB vs 174 kB — ~4.2×
larger** raw (206.56 vs 66.50 kB gzip, ~3.1× gzip). This tracks the source LOC delta
(legacy ~34k live LOC vs rebuild ~3.5k). The rebuild's own art is bundled as separate small PNGs
(largest character sheet 129.97 kB), not inlined into the JS chunk.

> Note: `vendor-phaser` (1.48 MB), `vendor-three` (739 kB), `vendor-rapier` (2.08 MB),
> `pdf.worker` (1.9 MB) are app-wide; phaser is the only one strictly required by either game route.
>
> **Bundle verdict: REBUILD WINS** — its game payload is ~4× smaller. (Both still pay the shared
> ~340 kB-gzip phaser tax.)

---

## 2. Load time — [MEASURED shell / ESTIMATED full-init]

**Route shell (dev server):** both routes return an identical **1,484 B** SPA HTML in **~0.0024s**
[MEASURED] — route selection is client-side, so the HTML response is not a differentiator.

**Entry-module fetch (dev, unminified) [MEASURED]:**
`createGame.js` 7,260 B / 1.18 ms (rebuild bootstrap) vs `config.js` 24,571 B / 1.32 ms (legacy
config). The legacy Phaser config alone is ~3.4× the rebuild bootstrap.

**Full game-ready time [ESTIMATED]** (parse + Phaser boot + scene preload), reasoned from chunk size and
scene count:

- **REBUILD:** parses ~174 kB game chunk, boots Phaser, preloads **1 playable scene**
  (`NeighborhoodScene`) + small overlay scenes. Fewest assets, smallest parse → fastest to interactive.
- **LEGACY:** parses ~724 kB game chunk, registers **21 scenes** at boot (`config.js:52-72`), starts at
  `ZuzuGarageScene` (`GameContainer.jsx:450`). 4× the parse + 21-scene registration + multi-scene asset
  graph → slower to first-interactive.

> **Load-time verdict: REBUILD WINS** (smaller parse, single scene to first-interactive). Legacy's
> 21-scene registration and 4× chunk make cold start meaningfully slower; exact ms not profiled.

---

## 3. FPS — [ESTIMATED from architecture]

Both use Phaser arcade physics (`createGame.js:21-27`; legacy `config.js:124`). FPS is dominated by
per-frame `update()` work and live object count.

- **REBUILD** — one scene, world 1600×1000, camera follows Zuzu. `NeighborhoodScene.update()`
  (`:1122-1149`) does cheap work: velocity smoothing, nearest-interaction scan over ~13 zones, prompt
  positioning. No procedural spawning, no physics simulation tick, no graph validation per frame.
  **Expect a stable 60 FPS** on modest hardware; render cost is mostly static sprites + a few
  visualizers (UTM, chemistry, GPS HUD).
- **LEGACY** — heavier per-scene update potential: `ecologyEngine.js` (485) seeds procedural flora/fauna
  across a 1536×1024 world (`hashPosition` PRNG), `WorldMapScene.js` (1,705 LOC) is a full travel map,
  and several scenes mount lab rigs / construction systems with interactive objects. Per-scene object
  counts are higher and some scenes can run richer update logic. **Expect 60 FPS in simple sub-scenes
  but more variance / drop risk in dense scenes** (overworld with spawned ecology, lab rigs).
  Simulation engines (`simulationEngine.js` 928, `stressSimulation.js`) are event-triggered, not
  per-frame, so they don't tax steady-state FPS — but they spike on invocation.

> **FPS verdict: REBUILD WINS (steady-state)** — fewer live objects and trivial update loop give a more
> predictable 60 FPS. Legacy is fine in light scenes but carries higher worst-case variance. Not
> profiled — estimated from object/update complexity.

---

## 4. Memory — [ESTIMATED from LOC / scene complexity]

- **REBUILD** — ~3.5k live LOC, 20 small systems, **1** scene's objects resident at a time, ~3.1 MB of
  bundled art (largest sheet 130 kB). Compact heap; system instances are Maps/Sets over tiny Act-1
  datasets (`Act1RuntimeSystem.js:36-69`). **Lowest memory footprint.**
- **LEGACY** — ~34k live LOC, 40+ systems, 21 registered scenes, and large data tables
  (`data/quests.js` 1,690 LOC, materials/flora/fauna/plant-chemistry databases, ~11.6k data LOC).
  Procedural ecology spawning and lab-rig scenes allocate more game objects; even inactive registered
  scenes hold class definitions. **Higher baseline + higher peak** (dense scenes, spawned entities).

> **Memory verdict: REBUILD WINS** — an order-of-magnitude less code/data resident and a single live
> scene. Estimated from LOC, data-table size, and scene/object counts; not heap-profiled.

---

## 5. Responsiveness — [ESTIMATED, partial MEASURED context]

"Responsiveness" = input→feedback latency and UI smoothness.

- **REBUILD** — input is a tight loop: nearest-zone scan + `[E]` prompt + `handleInteraction`
  (`NeighborhoodScene.js:1134-1149`). Feedback is immediate (toast, notebook, sprite swap). Per the
  prior runtime audit, full Act 1 completes in ~1.5 min with snappy press-E interactions. **High
  responsiveness, low latency** — but shallow (no enforced gating, one-and-done dialogue).
- **LEGACY** — richer interactions (place-each-beam construction in `DryWashScene`, lab instruments,
  world-map travel with `seamlessTraversal` edge sensors) add more input modes but also more work per
  interaction and scene transitions (load/preload between scenes). **Responsive within a scene; scene
  transitions add perceptible load beats** the rebuild never pays (it has no scene transitions).

> **Responsiveness verdict: TIE / context-dependent** — rebuild has lower latency and no transition
> stalls; legacy offers richer (heavier) interactions but pays scene-transition load. Different
> trade-offs, neither strictly faster for a player.

---

## 6. Summary scorecard

| Metric | Measured? | Verdict | Evidence |
|---|---|---|---|
| Bundle size | **MEASURED** | **REBUILD** | game chunk 174 kB vs 724 kB (build/assets) |
| Load time | MEASURED shell / EST init | **REBUILD** | 7.2 kB bootstrap vs 24.6 kB config; 1 vs 21 scenes registered |
| FPS (steady) | ESTIMATED | **REBUILD** | trivial update loop, 1 scene vs procedural ecology + dense scenes |
| Memory | ESTIMATED | **REBUILD** | ~3.5k vs ~34k live LOC; 1 vs 21 resident scenes |
| Responsiveness | ESTIMATED | **TIE** | rebuild = low latency/no transitions; legacy = richer but transition stalls |

**Bottom line:** On every *quantitative performance* axis the **Rebuild wins or ties** — it is ~4×
smaller in game-code bundle [MEASURED], boots one scene instead of 21, and keeps a tiny heap and a
trivial per-frame loop. The Legacy's larger footprint is the direct cost of its much greater system
breadth (Phase 7), not waste per se — but as a *runtime artifact*, the Rebuild is the lighter, faster,
more predictable build. The only place the Legacy is not clearly behind is in-scene responsiveness,
where its richer interactions and the Rebuild's transition-free single scene roughly cancel out.
