# Acceptance Comparison — Legacy vs Rebuild (Phase 13)

**Method:** Evidence-based, per-dimension. Reality (runtime + artifacts) >
docs. Scored **Legacy / Rebuild / Tie** with `file:line` citations. The central
question: does each tree have an *acceptance pipeline* — a scripted, asserted,
artifact-producing walkthrough that PASSES/FAILS — and can the LEGACY be
acceptance-tested at all?

- **LEGACY** = `src/renderer/game/` → `/legacy-play` (`src/renderer/App.jsx:81`)
- **REBUILD** = `src/game/` → `/game-rebuild` (`src/renderer/App.jsx:80`)

---

## Headline finding

> **The Rebuild has a real acceptance pipeline. The Legacy has none.**
> The Legacy *boots* and is *reachable*, but it cannot be cleanly
> acceptance-tested today: there is no scripted player-visible walkthrough
> with completion assertions, no PASS/FAIL gate, and no acceptance score for
> `/legacy-play`. That absence is itself the finding.

### Rebuild pipeline (exists, PASSES)
- **Scripted player-visible walkthrough** that *walks the avatar* via real
  arrow-key movement to each interaction zone and presses `E` (no backend
  shortcuts except `resetAct1` before play):
  `tests/e2e/game-rebuild.act1-acceptance.spec.js:33-88,96-187`.
- **Hard completion assertions:** `act1Complete === true`,
  `bridgeReconnected === true`, `widerMapUnlocked === true`, ≥4 material tests,
  and the exact final-feedback message
  (`game-rebuild.act1-acceptance.spec.js:219-234`).
- **Artifacts emitted:** 11 sequential screenshots + machine + human reports
  (`playtest_captures/game_rebuild_act1_acceptance/00…11_*.png`,
  `act1_player_visible_acceptance_report.json/.md`).
- **Report proves no cheating:** `"backendCompletionShortcutsUsed": false`,
  `act1Complete: true` (`act1_player_visible_acceptance_report.json:4,62`).
- **Scored & accepted by the Executive Brain:** total **87.43 / accepted: true**,
  Acceptance dimension **100**
  (`artifacts/act1_acceptance_refresh/2026-06-02T03-17-19-794378Z/acceptance_score.json:14-16,22`),
  policy "fresh evidence only" (`:5`). Brain wiring:
  `brain/cli.py` (act1-acceptance executor).

### Legacy pipeline (does not exist)
- **No `/legacy-play` acceptance spec, no acceptance score, no walkthrough
  report.** Filesystem search for any `*legacy*accept*` / `*renderer*accept*`
  artifact returns nothing.
- The only `/legacy-play` automated coverage is an **ad-hoc reachability
  probe** I located (`tests/e2e/legacy-vs-rebuild.audit.spec.js:30-189`) — it
  boots the route, dumps scene state, jiggles arrow keys, and force-starts
  scenes to check *registration*. It makes **no completion assertion** and does
  **not gate** on a finished arc; its own comment calls it "honestly determine
  whether each route BOOTS and is PLAYABLE … not docs"
  (`legacy-vs-rebuild.audit.spec.js:4-7`). This is diagnostics, not acceptance.

---

## Per-dimension comparison table

| Dimension | LEGACY (`/legacy-play`) | REBUILD (`/game-rebuild`) | Winner |
|---|---|---|---|
| **Visual** | Boots to splash → garage hub, canvas 1280×720, 70 children, art = emoji props (`legacy_runtime.json:118-146,162-166`). No scripted visual-capture acceptance. | 11 captioned acceptance screenshots across the full arc; visual-capture spec exists (`tests/e2e/game-rebuild.act1-visual-capture.spec.js`); Visual Quality scored 80 (`acceptance_score.json:11`). | **Rebuild** (asserted captures) |
| **NPC** | NPCs/dialogue systems present (`npcLanguageSystem.js`, `gameAI.js`) but no acceptance step proving an NPC interaction. | Acceptance walks to **Mr. Chen** and asserts the mentor voice line fired (`game-rebuild.act1-acceptance.spec.js:112-118`); payoff line "You did not guess. You tested, then built." (`ConstructionSystem.js:47`). | **Rebuild** (NPC step asserted) |
| **Exploration** | **Broader world registered** — 20+ scenes incl. Overworld, WorldMap, DryWash, CopperMine, DesertForaging, Mountain, LakeEdge, CommunityPool, DogPark (`legacy_runtime.json:8-113,183-232`, all `registered:true`). But the probe lands in the garage with `interactiveCount:0` and `playerPos:{x:null,y:null}` (`:119,148-151`); no asserted traversal between scenes. | Single Neighborhood scene; acceptance walks the avatar to ~9 interaction zones via real movement w/ a 120-step walk guard (`game-rebuild.act1-acceptance.spec.js:33-48`). | **Legacy** for *breadth registered*; **Rebuild** for *proven traversal*. Net: **Tie**. |
| **Educational** | Deep systems (UTM stress-strain, cognitive puzzles) but **no acceptance proves a learning act**; Educational dimension unscored for legacy. | Acceptance asserts the learning chain: ≥4 UTM tests, ecology observed, chemistry result, evidence-gated bridge plan + repair (`game-rebuild.act1-acceptance.spec.js:151-173,222-233`); Educational Quality scored 82 (`acceptance_score.json:12`). | **Rebuild** (learning asserted) |
| **Progression** | No enforced completion arc; boots to a hub, scenes reachable only by force-start in the probe (`legacy-vs-rebuild.audit.spec.js:170-184`). | Linear arc asserted end-to-end: bike→wash→materials→UTM→plan→repair→unlock, 8/8 flow steps ok (`rebuild_runtime.json:79-111`). | **Rebuild** |
| **Completion** | **Cannot assert completion** — no "act complete" signal, no final-state report for `/legacy-play`. | `act1Complete:true` + final notebook screenshot + report (`act1_player_visible_acceptance_report.json:62-88`); Acceptance dimension 100, total accepted (`acceptance_score.json:16-17`). | **Rebuild** |
| **Boots clean?** | **Yes** — `booted:true`, `activeSceneFound:true`, `consoleErrors:[]`, `runtimeAudit.passed:true` (`legacy_runtime.json:167-169,233,3-7`). | **Yes** — `booted:true`, `consoleErrors:[]` (`rebuild_runtime.json:2,113`). | **Tie** (both boot) |
| **Acceptance pipeline exists?** | **No** — only a diagnostic probe, no PASS/FAIL gate, no score. | **Yes** — scripted, asserted, scored, artifacted. | **Rebuild** |

---

## "Can the Legacy be acceptance-tested at all?" — analysis

**Bootable: yes. Cleanly acceptance-testable: not today.** Concrete blockers
observed in the live probe:

1. **No completion contract.** The rebuild exposes a single state oracle
   (`window.__GAME__.getAct1State()` → `act1Complete`,
   `game-rebuild.act1-acceptance.spec.js:181`) the test asserts on. Legacy has
   **no equivalent "arc complete" boolean**; the world is a hub of 20+ scenes
   with no linear win-state to assert (`legacy_runtime.json:8-113`).
2. **Player position is unreadable from the probe.** `playerPos:{x:null,y:null}`
   even though `hasPlayer:true` (`legacy_runtime.json:113,148-151`), so a
   movement-based walkthrough (the rebuild's whole method,
   `game-rebuild.act1-acceptance.spec.js:33-48`) can't navigate deterministically.
3. **`interactiveCount:0` on the active scene** (`legacy_runtime.json:119`) —
   the probe could not enumerate interactable objects to drive, so steps would
   have to be force-started, not player-visible.
4. **Cross-scene reachability is force-started, not played.** The probe reaches
   the overworld only via `scene.start('OverworldScene')`
   (`legacy-vs-rebuild.audit.spec.js:170-184`), which by acceptance rules is a
   backend shortcut — the opposite of the rebuild's
   `"backendCompletionShortcutsUsed": false`
   (`act1_player_visible_acceptance_report.json:4`).

**Net:** Legacy *could* be made acceptance-testable, but it would first need a
completion oracle, readable player coordinates, and an interactable registry —
none of which exist on `/legacy-play` today. **The inability to cleanly
acceptance-test the legacy is itself a headline finding.**

---

## Verdict (per-dimension, no global merge/delete)

| | Legacy | Rebuild | Tie |
|---|---|---|---|
| Visual | | ✓ | |
| NPC | | ✓ | |
| Exploration | (breadth) | (proven) | ✓ |
| Educational | | ✓ | |
| Progression | | ✓ | |
| Completion | | ✓ | |
| Boots clean | | | ✓ |

**Rebuild 5, Tie 2, Legacy 0 on the acceptance axis.** Legacy's only edge is
*breadth of registered world*, which it cannot yet *prove* through play. The
Rebuild owns acceptance because it was built with a state oracle, a scripted
player-visible walkthrough, completion assertions, screenshot artifacts, and a
Brain-scored gate (87.43, accepted) — and the Legacy has none of these.
