# BikeBrowser Act-1 Release Checklist (Executive Brain)

Target: a polished, memorable, completable **Act 1 / Chapter 1** demo.

## Functionality
- [x] Build clean (`npm run build`).
- [x] Act 1 completable end to end (earn_trust fixed; Quests 9–10 reachable).
- [x] Playwright smoke green on dedicated port (5219; no chatbot collision).
- [ ] Broader e2e suite reviewed/green (acceptance, reachability) — re-run on the
      fixed harness; reconcile any NPC-count assertions affected by Dex.
- [ ] Save/load round-trip verified with new content (side quests, Dex states).

## Content
- [x] Branching dialogue for all major NPCs.
- [x] Recurring rival (Dex) full arc.
- [x] Two choice-driven side quests (multiple outcomes).
- [x] Emotional heart-beats for all five characters.
- [x] Community-crossing payoff moment (Mateo safe; block reacts) — **The Community
      Crossing Sequence** (6 scenes; verified end-to-end + zuzu_crossing unlock).
- [ ] Character/lore/world consistency pass vs the bibles (no drift).

## Art
- [x] DRAFT/watermarked assets purged from runtime + build (P0).
- [ ] Art part B: live SVG placeholder props replaced via proposals (human review).
- [ ] Unique Dex sprite (currently tinted placeholder).
- [ ] One scale/style enforced; chromatic-fringe frames cleaned.

## Hygiene / repo
- [x] Abandoned parallel implementations quarantined.
- [x] Stale root docs reconciled (README/STATUS banners).
- [ ] Resolve pre-existing dirty working-tree items (act1AssetManifest.js; stray
      untracked dirs) — decide keep/commit/discard.
- [ ] Repo/binary footprint trimmed (.git, large media) — release hygiene.

## Governance
- [ ] Push branch / open PR (needs user approval).
- [ ] Final decision_log + project_status updated.

## Definition of done (Act 1 demo)
Completable, no placeholder art in the shipped build, trustworthy tests, one
canonical runtime, accurate docs, and a player who **remembers the five characters**
and **feels** Observe→Predict→Test→Trust-Evidence.
