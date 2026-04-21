# BikeBrowser Architecture

## Overview

BikeBrowser is a child-friendly desktop app for learning about bikes through videos, projects, shopping research, and an adventure game. Built on Electron + React + Vite + Tailwind + Phaser 3.

## Startup Commands

| Mode | Command | What starts |
|------|---------|-------------|
| **Web dev (recommended)** | `npm run dev:web` | Vite + API server (concurrently) |
| Electron dev | `npm run dev` | Vite + Electron (API auto-starts in main process) |
| Vite only | `npm run dev:react` | Vite renderer only (no search/shopping) |
| API server only | `npm run server` | Express API on :3001 |
| Production build | `npm run build` | Vite production build |
| Rebuild native modules | `npm run rebuild:native` | Recompiles better-sqlite3 for Electron ABI |
| Cloudflare tunnel | `npm run tunnel` | Exposes localhost:5173 as bike-browser.com |
| Health check | `npm run check:health` | Verifies all services, native modules, tunnel |

## Native Modules

BikeBrowser uses `better-sqlite3`, a C++ native module that must be compiled against the correct Node ABI. Electron has its own ABI (different from system Node), so after `npm install` or Electron version changes, native modules must be rebuilt:

```bash
npm run rebuild:native
```

This runs `@electron/rebuild -f -w better-sqlite3` against the project's Electron version. A `postinstall` hook also runs this automatically.

**Symptoms of ABI mismatch:** Electron crashes at startup with `NODE_MODULE_VERSION X was compiled against a different Node.js version`. Fix: run `npm run rebuild:native`.

## Public Access (Cloudflare Tunnel)

The app is publicly accessible at `bike-browser.com` via a Cloudflare Tunnel. The tunnel requires:

1. Local Vite dev server running on `:5173` (`npm run dev:web`)
2. `cloudflared` process running (`npm run tunnel`)

**Tunnel config:** `~/.cloudflared/config.yml` routes `bike-browser.com` -> `localhost:5173`.

**To bring up the full public stack:**
```bash
npm run dev:web &       # Start Vite + API server
npm run tunnel &        # Start Cloudflare tunnel
npm run check:health    # Verify everything
```

**Common tunnel issues:**
- Error 1033: `cloudflared` not running or local origin not reachable
- Fix: start `npm run dev:web` first, then `npm run tunnel`

## Service Dependencies

| Feature | Needs API Server (:3001) | Needs External API | Works Browser-Only |
|---------|-------------------------|-------------------|-------------------|
| Home, Learning, Game | No | No | Yes |
| Video search/ranking | **Yes** | YouTube API key | No |
| Shopping prices | **Yes** | eBay/Amazon keys | No |
| Build planner AI | **Yes** | DeepSeek/OpenAI | No |
| Local stores | Electron IPC only | Google Maps key | No in web |
| Project management | No | No | Yes |
| Save/load, Audio | No | No | Yes |

### Backend readiness
The renderer includes a `useBackendReady` hook that polls the API health endpoint on startup. Backend-dependent pages (e.g. YouTube search) show "Starting search services..." while waiting, and a precise error if the server fails to start.

### Electron auto-start
In Electron mode, `main.js` automatically starts the API server in-process (line ~569). If port 3001 is already taken, it reuses the existing server.

## Process Model

```
┌────────────────┐     IPC      ┌────────────────────┐
│  Electron Main │◄────────────►│  Renderer (React)  │
│  (Node.js)     │   preload    │  (Browser context)  │
│                │   bridge     │                      │
│  - SQLite DB   │              │  - React Router      │
│  - YouTube API │              │  - Zustand stores    │
│  - AI providers│              │  - Phaser 3 game     │
│  - Search pipe │              │  - Shopping services  │
│  - Rankings    │              │  - localStorage       │
└────────────────┘              └────────────────────┘
        │
        │ HTTP
        ▼
┌────────────────┐
│  Express API   │
│  Server (:3001)│
│  - Mobile QR   │
│  - LAN access  │
│  - /search     │
│  - /rank       │
└────────────────┘
```

## Directory Structure

```
src/
├── main/               # Electron main process
│   ├── main.js         # Window mgmt, IPC handlers
│   ├── search-pipeline.js
│   ├── deepseek/       # AI provider system
│   ├── services/       # History, image intent, voice intent
│   ├── source-managers/# Content source plugins
│   ├── filters/        # Safety & shopping filters
│   └── config/         # Perf profile, AI config
├── preload/
│   └── preload.js      # Secure IPC bridge
├── renderer/
│   ├── App.jsx         # Root: Router + AppLayout
│   ├── pages/          # Route-level components
│   ├── components/     # Shared UI components
│   ├── hooks/          # React hooks (shopping, search, etc.)
│   ├── services/       # Client-side services
│   ├── game/           # Phaser 3 game system
│   │   ├── editor-scenes/ # Editor-owned scene base classes
│   │   ├── scenes/     # Code-owned scene subclasses
│   │   ├── prefabs/    # Reusable object prefabs
│   │   ├── entities/   # Player, Npc
│   │   ├── systems/    # Quest, inventory, save
│   │   ├── audio/      # AudioManager, manifest, procedural
│   │   ├── data/       # Quests, items definitions
│   │   └── ui/         # HUD helpers
│   ├── state/          # User location state
│   └── utils/          # Shared utilities
├── server/             # Express API server
├── services/           # Shared services (DB, ranking, etc.)
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── compatibility/      # Part compatibility engine
├── learning/           # Learning path engine
├── pipeline/           # Image/voice → query pipeline
├── cache/              # LRU cache
├── utils/              # Shared utilities
└── workers/            # Web workers (ranking)
```

## Persistence Model

| Layer | Technology | Data | Scope |
|-------|-----------|------|-------|
| Main process | SQLite (better-sqlite3) | Channels, ranking cache, embed feedback, watch history | Electron-only |
| Renderer | localStorage via Zustand | Projects, items, notes, compatibility | Browser-safe |
| Renderer | localStorage | Game saves, audio settings | Browser-safe |
| API Server | JSON files | Server state, history | LAN |

## Routes

| Path | Page | Layout |
|------|------|--------|
| `/` | HomePage | Normal (header + footer) |
| `/youtube/search` | YouTubeSearchView | Normal |
| `/youtube/watch/:videoId` | VideoWatchPage | Normal |
| `/project-builder` | ProjectBuilderPage | Normal |
| `/build-planner` | BuildPlannerPage | Normal |
| `/saved-notes` | AllProjectNotesPage | Normal |
| `/shop` | ShoppingPage | Normal |
| `/safe-search` | SafeSearchPage | Normal |
| `/play` | GamePage | **Immersive** (no chrome, 100dvh) |

## Key Subsystems

### Video Ranking
Main process: `rankingEngine.js` → `featureExtractor.js` + `fastRules.js` + `db.channels`
Score = fast rules + weighted features (topical, educational, entertainment, complexity) + trust bonus + embed status

### Project Management
Zustand store: `projectStore.ts` → localStorage (`bikebrowser_projects`)
Features: items with fingerprinting, preferred/deprioritized decision engine, notes with dedup, compatibility checks

### Shopping
Renderer hooks: `useProjectShopping` → `PriceSearchService` → IPC → main process
Sources: Amazon, eBay, Walmart, local stores (Google Places)
Features: price comparison, best value, project cart, zip-aware local stores

### Game (Phaser 3 + Phaser Editor)
`GameContainer.jsx` wraps Phaser instance. Two scenes (Garage, Neighborhood).
Quest system: pure functions operating on save state.
Audio: Web Audio API with volume buses, procedural fallback for missing assets.

**Phaser Editor integration:** The game uses a hybrid architecture where scene layout is authored in Phaser Editor (editor-generated base classes in `editor-scenes/`) and custom game logic lives in subclasses (`scenes/`). Asset loading uses Asset Pack JSON files (`public/game/editor-assets/packs/`). See `docs/PHASER_EDITOR_MIGRATION.md` for full details.

```
game/
├── editor-scenes/     # Editor-owned: layout base classes
│   ├── GarageSceneBase.js
│   └── NeighborhoodSceneBase.js
├── scenes/            # Code-owned: custom logic subclasses
│   ├── GarageScene.js       (extends GarageSceneBase)
│   └── NeighborhoodScene.js (extends NeighborhoodSceneBase)
├── prefabs/           # Reusable object compositions
├── assetPackLoader.js # Pack loading utility
└── ...                # entities, systems, data, audio, ui
```
