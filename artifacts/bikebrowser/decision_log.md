# BikeBrowser Decision Log (Executive Brain)

Append-only record of material decisions and their rationale (arc.md-evaluated).

| # | Decision | Rationale | Commit/ref |
|---|---|---|---|
| 1 | Canonical repo = `C:\dev\bikebrowser`, canonical vision = `arc.md` | Verified via registry + repo; arc.md is current and matches code | — |
| 2 | Keep **pixel-JRPG / anime-adjacent**; NOT cel-anime | arc.md + visual_bible say SNES/GBA pixel; "anime" framing came from stale README; consistency over re-vision | art_bible |
| 3 | Ship **Act 1 / Chapter 1 (Sonoran bike)** first | arc.md is huge (3 acts/7 vehicles); the finishable unit is Act 1 | roadmap |
| 4 | Fix earn_trust by completing on both-neighbors-trust | Quest 9/10 were uncompletable; faithful to dialogue intent | P0 d077757 |
| 5 | Load only `final_ready` art; purge DRAFT files | DRAFT manifest declared runtime promotion forbidden; was shipping | P0 d077757 |
| 6 | Dedicated Playwright port 5219, reuseExistingServer:false | tests were hitting a Docker chatbot on 5173 | P0 d077757 |
| 7 | Quarantine (not delete) abandoned game trees | reduce confusion/bundle; preserve code | P1 71bfa9c |
| 8 | Branching dialogue via backward-compatible `choices` | fix flat 4/10 dialogue; no engine rewrite | 5fe54bb |
| 9 | Rival = **Dex** ("just send it" foil), reused sprite + tint | user-chosen; foil reinforces predict-before-intervene; no new art | e8e69f6 |
| 10 | Committed entangled prior-session HUD work with Dex | inseparable in NeighborhoodScene.js; preserve WIP, noted transparently | e8e69f6 |
| 11 | Side quests via existing systems, no new mechanics | dialogue+notebook+quest-tracking; multiple outcomes; never gate path | 2308e65 |
| 12 | Heart-beats reframe "test before you trust" as trust-between-people | emotional depth via relationships, not tutorials | c5f98a3 |
| 13 | Art improvement = proposal + human review for live assets | no local multimodal critique; avoid inconsistency | art_bible |
| 14 | **No LangChain** | no demonstrated measurable benefit; default-unnecessary | — |
| 15 | Built the **Community Crossing Sequence** by expanding the existing CrossingScene BEATS engine (no new system) | the emotional climax of Act 1: show *why* the bridge mattered (people, not wood/steel); 6 scenes (Mateo crosses, Ramirez relief, Mariam's seeds, Dex's visible care, Chen's wordless pride, Zuzu reflection) | this turn |
| 15a | Zuzu crossing line: selected "I thought I was fixing a bridge. Maybe I was building a way for people to come back to each other." (+ fuller notebook zuzu_crossing) | drafted 4 candidates (A directive-tone, B test-vs-people, C measured-vs-didn't, D selected); D is tight + memorable, notebook body fuses both north stars (evidence + community) | this turn |
| 15b | Mr. Chen's scene has **no speech** (just pride) | directive + "show, don't tell"; the player *infers* his trust — stronger than exposition | this turn |

## Standing rules
- arc.md wins all conflicts. Every change passes the decision test (deepen emotion +
  preserve STEM vision; relationships-not-facts; predict-before-intervene).
- Commits/pushes/destructive ops need user approval (project governance).
- Cultural specifics need human design briefs.
