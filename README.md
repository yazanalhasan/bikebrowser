# BikeBrowser — Educational STEM Adventure Game

BikeBrowser is a 2D educational adventure game. A child repairs bikes in the
Sonoran Desert and learns real engineering and science by doing: testing
materials on a Universal Testing Machine, designing a bridge against a real
structural-stress model, and observing desert ecology — built around an
**Observe → Predict → Engineer** pedagogy.

The authoritative design/vision document is [`arc.md`](./arc.md). This README is
the practical entry point and reflects the **actual code** (verify against the
source, not older docs).

> **Doc status note:** Several legacy root docs (`STATUS.md`, `NEXT_STEPS.md`,
> `DOCS_INDEX.md`, the `API_*`/`OPTIMIZATION_*`/`UX_*` files) describe an earlier,
> now-secondary product (a kids' YouTube-ranking browser). They are stale. Trust
> `arc.md` (vision), `docs/BACKLOG.md` (most accurate status), and this README.

## Tech stack
- **Game engine:** Phaser 3 (2D) — `src/game/phaser/`
- **Shell/UI:** React 18 + React Router, bundled by **Vite 5**
- **Desktop:** optional Electron wrapper
- **Art:** pixel-JRPG style (see `docs/game_rebuild/visual_bible.md`); Aseprite
  source under `src/game/art/source/`

## The canonical game
The single playable experience is the **Act 1 rebuild** at route **`/game-rebuild`**
(`src/renderer/pages/GameRebuildPage.jsx` → `src/game/GameShell.jsx` →
`src/game/phaser/createGame.js`). Act 1 is a completable ~30-minute slice:
bike check → discover the broken wash crossing → collect & test materials →
design and load-test a bridge → repair and cross → earn neighborhood trust →
unlock the wider map.

> Three earlier game prototypes (a legacy Phaser tree, a Three.js/R3F 3D
> prototype, and a Godot iframe build) have been **quarantined** — kept on disk
> but no longer routed or bundled. `/game-rebuild` is canonical.

## Quick start
```bash
npm install
npm run dev:react        # Vite dev server (http://localhost:5173)
# open http://localhost:5173/game-rebuild
```

Build a production bundle:
```bash
npm run build            # outputs to build/
```

## Tests
End-to-end tests use Playwright against a **dedicated** dev server on port 5219
(so they never collide with other apps that grab the default 5173):
```bash
npx playwright test                              # all e2e
npx playwright test game-rebuild.smoke.spec.js   # boot smoke test
# override the port if needed: BIKEBROWSER_E2E_PORT=5300 npx playwright test
```

## BikeBrowser+ pillars (context)
The wider "BikeBrowser+" concept has additional learning pillars (a safe-search
browser, a build planner, a shopping view, a spelling trainer). They exist under
their own routes but the **game is the active development focus**; see `arc.md`.

## Key paths
- Vision: `arc.md`
- Canonical game: `src/game/phaser/createGame.js` + `src/game/phaser/systems/`
- Entry: `src/game/GameShell.jsx` (route `/game-rebuild`)
- Art bible: `docs/game_rebuild/visual_bible.md`
- Status backlog: `docs/BACKLOG.md`
