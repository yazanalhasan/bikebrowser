# Audio + Music Audit

## Audio Assets

| Audio file | Import metadata |
| --- | --- |
| Assets/Audio/Music/copper_mine.mp3 | yes |
| Assets/Audio/Music/dry_wash_bridge.mp3 | yes |
| Assets/Audio/Music/garage_workshop.mp3 | yes |
| Assets/Audio/Music/neighborhood_street.mp3 | yes |
| Assets/Audio/Music/salt_river.mp3 | yes |
| Assets/Audio/Music/title_screen.mp3 | yes |
| Assets/Audio/Stingers/chain_repair_success.mp3 | yes |
| Assets/Audio/Stingers/quest_fanfare.mp3 | yes |

## AudioService References

| Referenced path | Exists |
| --- | --- |
| res://Assets/Audio/Music/copper_mine.mp3 | yes |
| res://Assets/Audio/Music/dry_wash_bridge.mp3 | yes |
| res://Assets/Audio/Music/garage_workshop.mp3 | yes |
| res://Assets/Audio/Music/neighborhood_street.mp3 | yes |
| res://Assets/Audio/Music/salt_river.mp3 | yes |
| res://Assets/Audio/Stingers/chain_repair_success.mp3 | yes |
| res://Assets/Audio/Stingers/quest_fanfare.mp3 | yes |

## Findings

- IMPLEMENTED: AudioService is an autoload and creates native `AudioStreamPlayer` nodes outside web builds.
- IMPLEMENTED: MP3 files for neighborhood, garage, copper mine, salt river, title, dry wash, and stingers exist.
- PARTIALLY IMPLEMENTED: `desert_trail` is not mapped in `MUSIC_BY_REGION`, so it uses default neighborhood music.
- PARTIALLY IMPLEMENTED: Web audio is oscillator/speechSynthesis based; native Godot uses MP3 and DisplayServer TTS.
- PLATFORM DEPENDENT: Native TTS depends on OS/Godot support.
- RISK: Music starts on `EventBus.region_entered`; running a scene directly without region entry may produce silence.
