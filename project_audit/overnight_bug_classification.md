# Overnight Bug Classification — 2026-05-18

| Issue | Class | Reproduction | Owning System | Invariant | Decision |
| --- | --- | --- | --- | --- | --- |
| `/youtube/search` no-query state showed loading | onboarding / route coherence | Open `/youtube/search` without `q` | `YouTubeSearchView` | A route with no query should invite action, not imply work in progress | Fixed |
| `/play3d` showed keyboard/debug instructions | debug leakage / route coherence | Open `/play3d` | `Game3D` | Debug-control copy should be opt-in and not public by default | Fixed |
| `/play` mobile has large portrait bottom margin | mobile layout / mechanic readability | Open `/play` at `390x844` | Godot camera/layout | The first playfield should occupy enough viewport for touch play and mechanic readability | Defer focused Godot pass |
| Utility empty states are sparse | UI clutter / emotional coherence | Open saved notes, safe search, build planner with no data | React app shell/pages | Empty states should clarify next action without looking broken | Defer, lower priority |
| Spelling trainer upload helper request fails when server absent | telemetry / optional helper | Open `/spelling-trainer` without upload helper | `SpellingTrainerApp` | Optional helpers should fail quietly and explain availability | Defer, low risk |
| YouTube embed/stat requests abort in headless | external service / error recovery | Open blocked `/youtube/watch/:id` under Playwright | YouTube iframe/fallback | Blocked embeds should offer fallback, not a broken player | Existing fallback adequate |
| Godot headless shutdown prints ObjectDB/resource messages | Godot runtime | Run any headless Godot validation | Godot engine/project shutdown | Validation pass/fail should be judged before known shutdown noise | Documented, no action |
| Browser quest playthrough is state-complete but not movement-complete | progression / validation | `npm run test:e2e` | Playwright test strategy | Quest graph validation should not substitute for tactile path validation | Defer more Godot player-path tests |
| `SystemShowcase` region is demo-like | route coherence / side-region gating | Region registry review | Godot region registry | Child play path should not expose dashboard/toolkit energy | Defer explicit hidden/gated validation |

## Sibling Bug Search

- Route-level limbo appears most clearly in backend-dependent routes. YouTube search was the highest-value example because it is a child-facing normal route and had no-query ambiguity.
- Debug leakage appears in `/play3d`; canonical `/play` diagnostics remain opt-in and tested.
- Mobile framing affects Godot `/play` and diagnostics screenshots similarly, confirming the issue is canvas/world composition rather than React app chrome.

## Fix/Defer Rationale

Tonight's fixes were limited to high-confidence route coherence issues. Deeper Godot mobile framing and save/re-entry work are more valuable than broad utility-page polish, but they should be handled in a focused pass with visual validation after export.

