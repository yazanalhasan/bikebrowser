# Validation Report — Act 1 (Executive Brain)

Run on branch `eb/p0-defect-sweep` (pushed). Playwright on dedicated port 5219.

| Command | Result | Interpretation |
|---|---|---|
| `npm run build` | ✅ clean (~6s; chunk-size warnings only) | production bundle builds; no errors |
| `playwright test game-rebuild.smoke.spec.js` | ✅ 1/1 | boots; drives full critical path (materials→bridge→repair→wider-map); quest+dialogue substrate intact |
| `playwright test game-rebuild.act1-complete.spec.js` | ✅ 1/1 | **full data-driven Act 1 progression + save/resume** works |
| `playwright test game-rebuild.bridge-reachability.spec.js` | ✅ 2/2 | real keyboard bridge design: weak design fails, sound one holds; Escape never traps |
| Content driver (side quests + crossing) | ✅ | `duel=true, garden=true, crossingDone=true (14 beats), crossingNote=true (zuzu_crossing unlocked)` |
| `node scripts/art/asset_audit.mjs` | ✅ ran | 112 images; **0 placeholder-named, 0 zero-byte**; 8 missing manifest finalPath files (the P0-deleted drafts — dangling entries, loader skips them) |

## Failures
None blocking. One non-blocking finding:
- **8 dangling draft manifest entries** in `act1AssetManifest.js` point at the
  P0-deleted DRAFT files. The loader loads only `final_ready`, so they never load (no
  runtime error). **Cleanup (remove the dead entries) recommended before release** —
  low-risk, non-blocking.

## Not run (honest)
- **Full Playwright suite (20+ specs)** not exhaustively run. The specs that
  hard-assert NPC counts/placements (e.g. character-art-audit, all-scenes snapshot)
  may need reconciliation for the **added Dex NPC** and the **Dex reposition**. The
  representative acceptance specs above pass; a full-suite pass + snapshot
  reconciliation is a pre-merge task.
- Save/load with the *new* side-quest/Dex state beyond what act1-complete exercises.

## Verdict
Act 1 is **functionally green** on the critical path, full progression, save/resume,
bridge mechanics, and all new content (branching, Dex, side quests, Community
Crossing). Remaining gaps are **art quality (human-gated)** and **full-suite/snapshot
reconciliation** — non-blocking for an external playtest, must-do before merge.
