# Asset Audit (Phase 4) — Evidence-Based

**Scope:** Assets used by the LIVE `/game-rebuild` runtime (`src/game/`) vs off-path
(`src/renderer/game/`, `public/game/`) vs draft/design assets. Reality > docs.

The live scene loads from `src/game/art/final/act1/` (37 PNGs) via the manifest
`src/game/data/act1/act1AssetManifest.js` (38 entries, every one `status: 'final_ready'`)
and `AssetRegistry.js`. NPC/character art is verified at runtime by
`artifacts/art_audit/act1_character_visual_audit.json` (`"pass": true` overall).

---

## Summary by category

| Category | Production | Prototype | Placeholder | Missing | Notes |
|---|---|---|---|---|---|
| Characters (NPC + hero) | 4 | 0 | 0 | — | Zuzu + 3 NPCs, audit PASS |
| Creatures / fauna | 0 | 0 | 0 | **all** | No animal sprites in live runtime |
| Plants / vegetation | partial | yes | — | most species | Env clusters only; 12-plant dataset unwired |
| Buildings | 0 (live) | yes (drafts) | — | — | Live scene draws props, not houses |
| Vehicles | 0 sprites | — | — | bike/boat/etc | Bike is a static inspect prop (see vehicle_audit) |
| Props / environment | ~25 | 0 | 0 | — | All `final_ready` |
| UI / HUD | yes | 0 | 0 | — | notebook, HUD frame, map frame, NPC cues |
| Animations | 4 sheets | — | — | — | Aseprite 96px sheets, runtime-verified |
| Audio | yes | — | — | — | Real `.ogg`/`.mp3` music tracks |

---

## 1. Characters — PRODUCTION (live, runtime-verified)
The single strongest asset category. `artifacts/art_audit/act1_character_visual_audit.json`
verifies all 4 against their source sheets with `verifiedExactRuntimeFrame: true` and
per-character `pass: true` (mean-abs-error 15–18, well under the 34 threshold):

| Character | Texture key | Source sheet (`src/game/art/final/act1/characters/`) | Status |
|---|---|---|---|
| Zuzu (hero) | `act1.zuzu.walk.sheet` | `zuzu_walk_native96_sheet.png` (+ `zuzu_repair_4dir_sheet.png`) | **Production** |
| Mr. Chen | `act1.npc.garage_mentor.talk.sheet` | `mr_chen_talk_sheet.png` (+ `mr_chen_repair_sheet.png`) | **Production** |
| Mrs. Ramirez | `act1.npc.neighbor.talk.sheet` | `mrs_ramirez_talk_sheet.png` (+ cheer) | **Production** |
| Auntie Mariam | `act1.npc.arabic_mentor.talk.sheet` | `auntie_mariam_style_reference_sheet.png` | **Production** |

Animated at runtime: `NeighborhoodScene.createAnimatedNpc()` (`:827`) plays the sheet
animation when it exists, with idle bob tweens. Single static fallback PNGs
(`zuzu.png`, `npc_*.png`) also exist in the manifest.

## 2. Animations — PRODUCTION (4 sheets)
96×96 Aseprite-authored sheets (sources in `src/game/art/source/aseprite/act1/`,
final in `.../characters/`): walk/talk/repair/cheer/4-dir. Played via Phaser anims keyed
`zuzu.idle.down`, `chen.talk`, `ramirez.talk`, `mariam.talk` (per audit JSON). No creature
or vehicle animations exist.

## 3. Props & environment — PRODUCTION (live)
~25 `final_ready` PNGs in `src/game/art/final/act1/`, all wired through the manifest and
drawn by the scene: `garage_workbench`, `utm_rig`, `material_samples`, `chemistry_station`,
`bridge_broken`/`bridge_repaired` (the broken→repaired swap), `ecology_tokens`,
`environment_desert_road_system`, `environment_sonoran_mountain_vista`,
`environment_ecology_patch`, `environment_vegetation_cluster`, plus `prop_clarity_*` and
`prop_replacement_*` variants. **Note:** much in-scene detail is *procedurally drawn*
(Phaser Graphics `lineBetween`/tweens, `NeighborhoodScene.js:225+,314+,460+`), not sprites
— so the "art" is a hybrid of authored PNGs and runtime vector primitives.

## 4. UI / HUD — PRODUCTION (live)
`hud_frame.png`, `notebook_ui.png`, `ui_map_frame.png`, `map_gate.png`, and NPC interaction
cues `ui_npc_cue_heart/star/wrench.png`. The Field Notebook panel is built largely from
Phaser rectangles/text (`NeighborhoodScene.js:779-824`) layered over the frame art.

## 5. Audio — PRODUCTION (real files, live)
Real tracks under `public/game/audio/music/` consumed by `MusicSystem.js` and
`Act1AudioSystem.js`: `neighborhood_hybrid_ride.ogg`, `garage_warm_oud.ogg`,
`quest_focus_hybrid.ogg`, `desert_discovery.ogg`, `pixel_pedal_parade(.mp3/_v2)`,
`warm_hands_quiet_gears.mp3`, `qanun_jar_lid.mp3`. Stingers archived under
`public/audio/_archived/`. Plus an `NPCVoiceRegistry`/`SpeechNormalizationSystem` for
TTS-style speech. **Status: Production** (functional audio with culturally-themed tracks).

## 6. Buildings — DRAFT / off-path
No house sprites in the live scene. Building art exists only as **drafts** in
`public/game/assets/generated_drafts/` (`house_pueblo_01/02`, `house_territorial_01`,
`house_mission_01`, `wave1_road_system_draft`, `wave1_sonoran_vista_draft`). These are
generation drafts, not wired into `src/game/`.
**Classify: Placeholder/Draft (off-path).**

## 7. Creatures / fauna — MISSING
No animal/creature sprites in the live runtime or manifest. The design-doc fauna
(`yucca_moth`, `gila_woodpecker`, `elf_owl`, `kangaroo_rat`, `kit_fox`,
`western_diamondback`) referenced in `chapter1_quest_set_v1.md` have **no art**.
**Classify: Missing.**

## 8. Plants — PARTIAL (clusters only) / dataset unwired
Live runtime has vegetation as *clusters/background* art (`environment_vegetation_cluster`,
`vegetation_saguaro_cluster_draft` in drafts) and procedural cacti, not per-species sprites.
The authored 12-plant Sonoran dataset (`data/sonoran/plants.sonoran.js`) has **no
corresponding sprite assets** and is unwired. The off-path
`src/renderer/game/systems/ecology/ecologyAssetManifest.js` (159 LOC) is a richer ecology
asset list but belongs to `/legacy-play`.
**Classify: Partial (background art Production; per-species art Missing).**

## 9. Off-path art (`src/renderer/game/`)
The ~70k-LOC legacy tree has its own asset pipeline (`assetPackLoader.js`,
`editor-scenes/asset-pack.json`, `audio/audioManifest.js`, ecology manifest) plus
`generated_assets/` (`hunyuan3d/`, `meshy/` 3D pipelines). **None of this is on the
shipping path.** The live game uses ONLY `src/game/art/final/act1/`.

---

## Bottom line
Live-runtime art is a **tight, production-quality Act-1 set**: 4 runtime-verified
animated characters, ~25 final props/environment PNGs, full UI, and real audio — all
`final_ready` and audit-PASS. **Gaps that are flat-out Missing in the live game:**
creatures/fauna, per-species plants, and any building/vehicle sprites. Buildings and
expanded vegetation exist only as **generation drafts** or **off-path legacy assets**.
