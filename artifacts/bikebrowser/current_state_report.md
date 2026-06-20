# BikeBrowser Current State Report (Executive Brain)

Reconstructed from the live repo (code = source of truth). Branch
`eb/p0-defect-sweep` (ahead 2 of origin); remote `yazanalhasan/bikebrowser`.

## Technical architecture
- **Engine:** Phaser 3 (2D), the canonical game at route `/game-rebuild`
  (`src/game/phaser/createGame.js` + ~27 systems). Bundled by Vite 5; React shell;
  optional Electron.
- **Abandoned trees quarantined (P1):** legacy Phaser (`/legacy-play`), Three.js 3D
  (`/play3d`), Godot iframe (`/play`) — routes removed, code on disk, not bundled.
- **Build:** `npm run build` clean (~6s). **Tests:** Playwright on a dedicated port
  **5219** (P0 fixed the 5173 collision with a Docker chatbot). Smoke green.

## Act 1 status
A **completable ~30-minute single-act** educational game. Real engineering subsystems
(Materials UTM, structural-stress bridge model, save/load, quest chain, audio + TTS).
The earn_trust blocker (Quests 9–10) was **fixed in P0** — Act 1 now completes end to
end.

## Quests
10-quest main chain (Bike Check → … → First Wider Map) + **2 new side quests**
(Prediction Duel, Mariam's Garden). See quest_bible.md. Some main quests batch-
complete objectives (de-pad candidate).

## NPCs (all with branching dialogue now)
- **Zuzu** (player), **Mr. Chen** (garage mentor), **Mrs. Ramirez** (neighbor),
  **Auntie Mariam** (family mentor/Arabic layer), **Dex** (recurring rival — added
  this session). Plus sign/system speakers. See character_bible.md.

## Dialogue
Branching dialogue **engine** added (`DialogueSystem` choices + `DialogueScene`
choice UI). All major NPCs branch. **Emotional heart-beats** for all five characters
(Chen's porch regret, Dex's armor, Ramirez's Mateo, Mariam's seeds, Zuzu's notes).
Was a flat 4/10 walker; now real player agency + emotional depth.

## World / locations
Sonoran neighborhood hub, garage, dry wash + broken crossing, materials yard/UTM,
ecology patch, chemistry station, wider-map gate; world-building anchors (school,
mercado, garden across the wash). See world_bible.md.

## Progression
Linear main chain → wider-map gate (Act-1 → Act-2 hook). arc.md positions this as
**Chapter 1** of the seven-vehicle Ground act; e-bike/motorcycle/car are future.

## Art pipeline
Pixel-JRPG/anime-adjacent. Tier-1 painted backgrounds + best sheets are on-style;
Tier-4 placeholders need retirement; DRAFT assets purged (P0). Visual upgrade =
art part B (human-gated). See asset_audit.md + art_bible.md.

## Outstanding (non-blocking)
- Pre-existing dirty working-tree items: `act1AssetManifest.js` (M), untracked
  `artifacts/mission_*`, `brain/voice/`, `bridge_quest_bundle/`. The prior-session
  HUD layout work was committed (entangled) in e8e69f6.
- Art part B (live SVG props → Tier-1, unique Dex sprite) — proposal + human review.
- Quest de-pad pass; WorldMapScene stub.

## Shipped this ownership era (branch commits)
P0 (defects) · P1 (quarantine/docs) · branching engine · branching-all-NPCs · Dex ·
two side quests · emotional heart-beats. See decision_log.md.
