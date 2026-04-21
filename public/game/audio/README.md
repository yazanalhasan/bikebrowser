# Game Audio Assets

Place audio files for Zuzu's Bike Adventure here. The audio system loads files by key from `src/renderer/game/audio/audioManifest.js`.

## Directory Layout

```
audio/
  music/          Background music tracks (looping)
  ambient/        Ambient loops (neighborhood, garage, wind)
  sfx/
    ui/           UI interaction sounds (taps, opens, closes)
    bike/         Bike & mechanic sounds (wrench, pump, chain)
    world/        World interaction sounds (footsteps, doors, pings)
  stingers/       Short reward / unlock jingles (non-looping)
```

## Supported Formats

- **Preferred:** `.ogg` (Vorbis) — smallest size, broad support
- **Fallback:** `.mp3` — used if `.ogg` missing

The `AudioManager` tries `.ogg` first, then `.mp3`.

## Adding a New Sound

1. Place the file in the correct subdirectory (e.g. `sfx/bike/wrench_turn.ogg`).
2. Open `src/renderer/game/audio/audioManifest.js`.
3. Add an entry to the appropriate category array. **Include `style` and `mood` tags:**
   ```js
   {
     key: 'wrench_turn',
     path: '/game/audio/sfx/bike/wrench_turn',
     category: 'sfx_bike',
     loop: false,
     volume: 0.4,
     bus: 'sfx',
     style: 'modern',        // 'modern' | 'arabic-inspired' | 'hybrid'
     mood: 'mechanic',       // 'garage' | 'ride' | 'discovery' | 'quest' | 'reward' | 'ui' | 'mechanic' | 'world' | 'ambient'
     description: 'Short wrench ratchet sound',
   }
   ```
   Omit the file extension — the loader appends `.ogg` / `.mp3` automatically.
4. If the sound should play during a scene transition, add it to `SCENE_MUSIC`, `SCENE_MUSIC_ALT`, or `SCENE_AMBIENT`.
5. Call `audioMgr.playSfx('wrench_turn')` (or `playMusic`, `playAmbient`, `playStinger`) from your scene code.
6. To query tracks dynamically: `findByStyle('hybrid')`, `findByMood('reward')`, `findByStyleAndMood('arabic-inspired', 'discovery')`.

## Soundtrack Identities

The game supports three musical styles that can be layered and swapped:

### A. Modern Adventure / Rhythmic (`style: 'modern'`)
- Playful, driving, energetic
- Bike-riding momentum, neighborhood mission feel
- Standard game groove

### B. Arabic-Inspired / Tarab-Color (`style: 'arabic-inspired'`)
- Warm, melodic, elegant, magical
- Emotional warmth, wonder, desert exploration, discovery moments, heartfelt rewards
- Instruments: oud, qanun, nay (reed flute), violin/string ensemble, riq, darbuka
- Modal flavor inspired by: Bayati, Hijaz, Nahawand, Rast
- Focus on memorable, warm, original melodic identity

### C. Hybrid (`style: 'hybrid'`)
- Combines modern rhythm with Arabic-inspired instrumentation and melodic phrasing
- **This is the game's signature sound**
- Catchy, adventurous, emotionally rich

## Scene Music Mappings

| Scene              | Primary Music        | Alternate Music             | Ambient                |
|--------------------|----------------------|-----------------------------|------------------------|
| GarageScene        | `garage_theme`       | `garage_warm_oud`           | `garage_ambience`      |
| NeighborhoodScene  | `neighborhood_day`   | `neighborhood_hybrid_ride`  | `neighborhood_ambience`|

- `audioMgr.transitionToScene('GarageScene')` → plays primary music
- `audioMgr.transitionToSceneAlt('GarageScene')` → plays alternate (Arabic-inspired / hybrid) music

## Current Music Tracks

| Key                          | Style            | Mood      | Use Case                               |
|------------------------------|------------------|-----------|----------------------------------------|
| `garage_theme`               | modern           | garage    | Default garage background              |
| `garage_warm_oud`            | arabic-inspired  | garage    | Warm workshop — oud, percussion, strings |
| `neighborhood_day`           | modern           | ride      | Default neighborhood riding            |
| `neighborhood_hybrid_ride`   | hybrid           | ride      | Signature riding theme + Arabic colors |
| `quest_active`               | modern           | quest     | Standard quest focus                   |
| `quest_focus_hybrid`         | hybrid           | quest     | Focused repair — light pulse + melodic |
| `desert_discovery`           | arabic-inspired  | discovery | Desert exploration — nay, plucked strings |

## Current Stingers

| Key                          | Style            | Mood    | Use Case                                 |
|------------------------------|------------------|---------|------------------------------------------|
| `reward_stinger`             | modern           | reward  | Standard quest completion                |
| `upgrade_unlock`             | modern           | reward  | Upgrade unlock                           |
| `reward_tarabi_stinger`      | arabic-inspired  | reward  | Celebratory — qanun/oud/string sparkle   |
| `upgrade_unlock_hybrid`      | hybrid           | reward  | Elegant — mechanical + musical flourish  |

## Audio Settings

User settings (volume, mute per bus) persist in `localStorage` under key `bikebrowser_audio_settings`. Defaults:

- Music: 65%
- SFX: 80%
- Ambient: 45%

The in-game 🔊 button opens the settings panel.

---

## Adding Arabic-Inspired or Hybrid Tracks

### Recommended Instruments
- **Melodic:** oud, qanun (plucked zither), nay (reed flute), violin/string ensemble
- **Rhythmic:** riq (tambourine), darbuka/tabla, frame drum, hand percussion
- **Texture:** gentle plucked motifs, expressive melodic phrases, light drones

### Modal / Harmonic Flavor
- Use **original melodies** with a flavor inspired by maqam-like colors:
  - **Bayati** — warm, grounded, slightly bittersweet
  - **Hijaz** — mysterious, exotic, dramatic accents
  - **Nahawand** — gentle, lyrical, minor-like warmth
  - **Rast** — bright, natural, welcoming
- Don't overcomplicate theory — focus on memorable, warm, original identity

### Rhythmic Ideas
- Light Arabic / Levantine rhythmic influence where helpful
- Game-friendly and loopable
- Blend traditional percussion feel with modern game groove
- Avoid anything too intense, mournful, or overly dramatic

### Keeping Music Original
- **DO:** Create original loops, motifs, and short memorable melodic phrases
- **DO:** Use expressive strings, oud/qanun accents, subtle ornamental phrasing
- **DO:** Focus on musical warmth, wonder, and exploration
- **DON'T:** Copy melodies, vocal runs, or arrangements from known recordings
- **DON'T:** Imitate specific named artists or iconic orchestrations
- **DON'T:** Use lyrics or explicit vocal content
- **DON'T:** Use sad, heavy, tragic concert-drama energy for normal gameplay

### How to Tag a New Track
```js
{
  key: 'my_new_track',
  path: '/game/audio/music/my_new_track',
  category: 'music',
  loop: true,
  volume: 0.5,
  bus: 'music',
  style: 'hybrid',            // choose: 'modern' | 'arabic-inspired' | 'hybrid'
  mood: 'discovery',          // choose the primary context
  description: 'Short human-readable note about the track',
}
```

Then optionally wire it into `SCENE_MUSIC_ALT` or use `getMusicByStyle('hybrid')` in code to discover it dynamically.

## Guidelines

- Keep files short: music loops ~30-60s, SFX < 2s, stingers < 4s
- Normalize loudness to -14 LUFS (music) / -12 LUFS (SFX)
- All content must be kid-safe and royalty-free / original
- Instrumental only — no vocals
- No copied melodies, soundalikes, or imitations of named artists
