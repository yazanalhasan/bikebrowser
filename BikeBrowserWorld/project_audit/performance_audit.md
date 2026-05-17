# Performance + Memory Audit

## Largest Runtime-Relevant Files

| File | Size |
| --- | --- |
| exports/web/index.wasm | 35.9 MB |
| Assets/Audio/Music/copper_mine.mp3 | 13.4 MB |
| Assets/Audio/Music/dry_wash_bridge.mp3 | 7.3 MB |
| Assets/Audio/Music/salt_river.mp3 | 6.8 MB |
| Assets/Audio/Music/garage_workshop.mp3 | 4.9 MB |
| Assets/Audio/Music/title_screen.mp3 | 4.3 MB |
| Assets/Audio/Music/neighborhood_street.mp3 | 3.4 MB |
| Assets/Audio/Stingers/quest_fanfare.mp3 | 3.4 MB |
| Assets/Backgrounds/Raw/backgrounds_atlas_raw.png | 2.6 MB |
| Assets/Audio/Stingers/chain_repair_success.mp3 | 2.1 MB |
| Assets/Characters/MinerPete/MinerPete_point/raw-sheet.png | 2.1 MB |
| Assets/Characters/MinerPete/MinerPete_talk/raw-sheet.png | 2.0 MB |
| Assets/Props/Labs/Raw/labs_atlas_raw.png | 2.0 MB |
| Assets/Characters/MinerPete/MinerPete_idle/raw-sheet.png | 2.0 MB |
| Assets/Backgrounds/river_backdrop.png | 2.0 MB |
| Assets/Characters/James/James_talk/raw-sheet.png | 1.9 MB |
| Assets/Props/CopperMine/Raw/coppermine_atlas_raw.png | 1.9 MB |
| Assets/Props/SaltRiver/Raw/saltriver_atlas_raw.png | 1.9 MB |
| Assets/Props/Desert/Raw/desert_foraging_atlas_raw.png | 1.9 MB |
| Assets/Characters/Charlie/Charlie_talk/raw-sheet.png | 1.9 MB |
| Assets/Backgrounds/mine_interior_wall.png | 1.9 MB |
| Assets/UI/Raw/ui_atlas_raw.png | 1.9 MB |
| Assets/Characters/Jacob/Jacob_talk/raw-sheet.png | 1.9 MB |
| Assets/Characters/Zevon/Zevon_talk/raw-sheet.png | 1.9 MB |
| Assets/Characters/DrMaya/DrMaya_write/raw-sheet.png | 1.9 MB |
| Assets/Characters/James/James_idle/raw-sheet.png | 1.9 MB |
| Assets/Characters/Charlie/Charlie_idle/raw-sheet.png | 1.9 MB |
| Assets/Characters/Cole/Cole_talk/raw-sheet.png | 1.9 MB |
| Assets/Characters/RangerNita/RangerNita_talk/raw-sheet.png | 1.9 MB |
| Assets/Characters/RangerNita/RangerNita_point/raw-sheet.png | 1.9 MB |

## Findings

- GENERATED ARTIFACTS: `.godot/` and `exports/web/` are large generated folders inside the project tree.
- DUPLICATION: Character art often exists as raw sheet, cleaned sheet, per-frame PNGs, GIF, import metadata, and Godot cache output.
- SCENE LOADING: Region transitions use whole-scene swaps, which is acceptable now but can hitch as regions grow.
- AUDIO: MP3 tracks are loaded on demand by path rather than all preloaded at startup.
- PHYSICS: Current scenes appear light on collision shapes, so physics is unlikely to be a bottleneck yet.
- UNKNOWN: Real draw calls, texture memory, and overdraw require running Godot profiler/render debug locally.
