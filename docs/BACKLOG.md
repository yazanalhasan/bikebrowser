# BikeBrowser Product Backlog

## Completed
- [x] App shell with 9 routes, lazy loading, error boundaries
- [x] YouTube search with educational ranking engine
- [x] Video watch page with embed detection and fallback
- [x] Project management (Zustand store, items, notes, dedup, compatibility)
- [x] Shopping with price comparison (Amazon, eBay, Walmart)
- [x] Local store discovery via Google Places
- [x] Build planner with AI-powered analysis
- [x] All-project notes summary view
- [x] Game M1: Garage/Neighborhood scenes, Zuzu, Mrs. Ramirez, flat tire quest
- [x] Game audio system with procedural fallback
- [x] Game save/load with versioned localStorage
- [x] Mobile touch controls (d-pad + action button)
- [x] Immersive /play route (no app chrome)
- [x] Consolidated video ID normalization (shared utility)
- [x] ConnectionPanel health check quieted when no server
- [x] Learning topics data model (14 topics across 5 categories)
- [x] Persistent learning progress store (Zustand + localStorage)
- [x] Video → topic deterministic matching (keyword-based)
- [x] Home page learning progress section with recommendations
- [x] Game quest → learning progress integration (flat_tire_repair → topics)
- [x] Video topic badges on YouTube search results
- [x] Learning event recording on video watch
- [x] Shopping: improved product cards with source icons, free shipping, similar item fading
- [x] Shopping: enhanced local store cards with directions link, pickup indicator
- [x] Removed dead projectNotesService.js
- [x] `npm run dev:web` — unified web dev command (Vite + API server)
- [x] Backend readiness hook (`useBackendReady`) with health polling + backoff
- [x] YouTube search: "Starting search services..." gate instead of generic error
- [x] YouTube search: specific error for unreachable API server
- [x] Fixed better-sqlite3 native module mismatch (`npm rebuild`)
- [x] Electron already auto-starts API server (verified in main.js)
- [x] Updated ARCHITECTURE.md with startup commands and service dependency map
- [x] **M2: Second NPC** — Mr. Chen (retired engineer, blue, positioned on cross street)
- [x] **M2: Second quest** — Chain repair (7 steps, wrench + chain_lube, teaches drivetrain)
- [x] **M2: Quest board** — Shows active/available/completed/locked quests with rewards
- [x] **M2: Garage shop** — Buy upgrades with Zuzubucks (tool rack, work light, repair stand, extra patches)
- [x] **M2: Visible upgrades** — Purchased shop items appear in the garage scene
- [x] **M2: Generic NPC system** — _handleNpcInteract refactored for multi-NPC, multi-quest support
- [x] **M2: Quest board data** — Locked future quest slots (Brake Adjustment, Wheel Truing, ???)
- [x] **M2: Learning integration** — chain_repair quest → chains + tools + reading topics

## Quick Wins (1-2 hours each)
- [ ] Add "New Game" button to pause menu (resetGame already exists)
- [ ] Add walking animation toggle for Zuzu (flip sprite based on facing)
- [ ] Code-split Phaser into a separate vendor chunk (~1.5MB reduction in GamePage)

## Medium Refactors (half-day each)
- [ ] Improve shopping result dedup across retailers (cross-source grouping)
- [ ] Add "Why this part?" explanations in project shopping results
- [ ] Wire compatibility warnings into shopping recommendations

## Structural Work (multi-day)
- [ ] Unified search pipeline for both video and shopping
- [ ] Structured camera/image → part identification pipeline
- [ ] Structured voice → query pipeline
- [ ] Persistent learning state (skills unlocked, topics explored)
- [ ] Game M2: second quest, second NPC, sprite art replacement

## High Risk / Needs Research
- [ ] YouTube API quota management / rate limiting
- [ ] AI provider reliability (DeepSeek/OpenAI fallback behavior)
- [ ] SQLite → IndexedDB migration for browser-only mode
- [ ] PWA service worker for offline game play

## Next Milestones

### v0.2: Education Foundation
- Learning topics data model
- Video-to-topic tagging
- Visible learning progress on Home
- Game quest rewards tied to learning

### v0.3: Shopping Intelligence
- Cross-retailer dedup
- Compatibility-first ranking
- "Similar items" grouping UI
- Price history tracking

### v0.4: Game Milestone 2
- Second quest (chain repair or brake adjustment)
- Second NPC
- Sprite sheet art for Zuzu
- Walking animation
- Mini-map

### v0.5: Input Pipeline
- Camera → part identification
- Voice → structured query
- Pipeline output stored in project history
