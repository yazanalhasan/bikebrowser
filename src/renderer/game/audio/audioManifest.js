/**
 * Audio Manifest — defines every sound asset the game can use.
 *
 * Each entry specifies:
 *   key         – unique audio key
 *   path        – URL relative to the public/ folder (omit extension; loader tries .ogg then .mp3)
 *   category    – music | ambient | sfx_bike | sfx_ui | sfx_world | stinger
 *   loop        – whether the sound loops by default
 *   volume      – base volume (0-1) before bus scaling
 *   bus         – which volume bus controls it: music | sfx | ambient
 *   style       – soundtrack identity: 'modern' | 'arabic-inspired' | 'hybrid'
 *   mood        – contextual tag: 'garage' | 'ride' | 'discovery' | 'quest'
 *                 | 'reward' | 'ambient' | 'ui' | 'mechanic' | 'world'
 *   description – human-readable note for developers
 *
 * Style definitions:
 *   modern          — playful, driving, rhythmic; bike-riding momentum
 *   arabic-inspired — warm maqam-color melodies; oud, qanun, nay, strings;
 *                     emotional warmth, wonder, exploration, discovery
 *   hybrid          — modern rhythm fused with Arabic-inspired instrumentation
 *                     and melodic phrasing; the game's signature sound
 *
 * File format notes:
 *   • .ogg is preferred (small, widely supported)
 *   • .mp3 works everywhere as a fallback
 *   • .wav is fine for very short one-shots (<1s)
 *   • Place files under public/game/audio/<category>/
 *
 * To add a new sound:
 *   1. Drop the file into the correct public/game/audio/ subfolder
 *   2. Add an entry to the appropriate array below (include style + mood tags)
 *   3. The AudioManager picks it up automatically on next game load
 *   4. Use findByStyle() / findByMood() to query tracks dynamically
 */

// ---------------------------------------------------------------------------
// Music — looping background tracks
// ---------------------------------------------------------------------------
export const MUSIC = [
  // --- Modern tracks -------------------------------------------------------
  {
    key: 'garage_theme',
    path: '/game/audio/music/garage_theme',
    category: 'music',
    loop: true,
    volume: 0.55,
    bus: 'music',
    style: 'modern',
    mood: 'garage',
    description: 'Playful, mid-tempo, bouncy groove — working in the garage',
  },
  {
    key: 'neighborhood_day',
    path: '/game/audio/music/neighborhood_day',
    category: 'music',
    loop: true,
    volume: 0.55,
    bus: 'music',
    style: 'modern',
    mood: 'ride',
    description: 'Energetic, driving rhythm — riding around helping neighbors',
  },
  {
    key: 'quest_active',
    path: '/game/audio/music/quest_active',
    category: 'music',
    loop: true,
    volume: 0.45,
    bus: 'music',
    style: 'modern',
    mood: 'quest',
    description: 'Lighter tension, focused problem-solving feel',
  },
  // --- Arabic-inspired tracks ----------------------------------------------
  {
    key: 'garage_warm_oud',
    path: '/game/audio/music/garage_warm_oud',
    category: 'music',
    loop: true,
    volume: 0.5,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'garage',
    description: 'Warm workshop groove — oud, light percussion, soft strings; curious and welcoming',
  },
  {
    key: 'desert_discovery',
    path: '/game/audio/music/desert_discovery',
    category: 'music',
    loop: true,
    volume: 0.45,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'discovery',
    description: 'Spacious, mysterious desert wonder — nay, light percussion, plucked strings, subtle drones',
  },
  {
    key: 'warm_hands_quiet_gears',
    path: '/game/audio/music/warm_hands_quiet_gears',
    category: 'music',
    loop: true,
    volume: 0.5,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'garage',
    description: 'Warm Hands, Quiet Gears — gentle, soulful garage atmosphere; calm tinkering with oud-like warmth',
  },
  {
    key: 'qanun_jar_lid',
    path: '/game/audio/music/qanun_jar_lid',
    category: 'music',
    loop: true,
    volume: 0.45,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'quest',
    description: 'Qanun Jar Lid — plucked qanun-inspired melody; curious, inventive mood for quest and discovery moments',
  },
  {
    key: 'workshop_tarab',
    path: '/game/audio/music/workshop_tarab',
    category: 'music',
    loop: true,
    volume: 0.45,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'garage',
    description: 'Workshop Tarab — short tarab-infused garage groove; emotional warmth meets hands-on repair',
  },
  // --- Hybrid tracks -------------------------------------------------------
  {
    key: 'neighborhood_hybrid_ride',
    path: '/game/audio/music/neighborhood_hybrid_ride',
    category: 'music',
    loop: true,
    volume: 0.55,
    bus: 'music',
    style: 'hybrid',
    mood: 'ride',
    description: 'Upbeat neighborhood riding theme — modern rhythm with Arabic-inspired melodic colors; catchy and adventurous',
  },
  {
    key: 'quest_focus_hybrid',
    path: '/game/audio/music/quest_focus_hybrid',
    category: 'music',
    loop: true,
    volume: 0.4,
    bus: 'music',
    style: 'hybrid',
    mood: 'quest',
    description: 'Lower intensity focused repair/problem-solving — light pulse with melodic fragments',
  },
  // --- Pixel Pedal Parade — real recorded tracks ---------------------------
  {
    key: 'pixel_pedal_parade',
    path: '/game/audio/music/pixel_pedal_parade',
    category: 'music',
    loop: true,
    volume: 0.55,
    bus: 'music',
    style: 'modern',
    mood: 'ride',
    description: 'Pixel Pedal Parade — signature upbeat chiptune bike anthem; main title / menu theme',
  },
  {
    key: 'pixel_pedal_parade_v2',
    path: '/game/audio/music/pixel_pedal_parade_v2',
    category: 'music',
    loop: true,
    volume: 0.55,
    bus: 'music',
    style: 'modern',
    mood: 'ride',
    description: 'Pixel Pedal Parade v2 — extended version; neighborhood riding and exploration',
  },
  {
    key: 'pixel_pedal_parade_v3',
    path: '/game/audio/music/pixel_pedal_parade_v3',
    category: 'music',
    loop: true,
    volume: 0.45,
    bus: 'music',
    style: 'modern',
    mood: 'quest',
    description: 'Pixel Pedal Parade v3 — lighter arrangement; quest focus and puzzle moments',
  },
  {
    key: 'pixel_pedal_parade_v4',
    path: '/game/audio/music/pixel_pedal_parade_v4',
    category: 'music',
    loop: true,
    volume: 0.5,
    bus: 'music',
    mood: 'garage',
    style: 'modern',
    description: 'Pixel Pedal Parade v4 — workshop groove variant; garage tinkering vibes',
  },
  {
    key: 'pyramid_sandwalk',
    path: '/game/audio/music/pyramid_sandwalk',
    category: 'music',
    loop: true,
    volume: 0.46,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'quest',
    description: 'Pyramid Sandwalk — desert bridge-building and careful construction focus',
  },
];

// ---------------------------------------------------------------------------
// Stingers — short one-shot music cues (non-looping)
// ---------------------------------------------------------------------------
export const STINGERS = [
  {
    key: 'reward_stinger',
    path: '/game/audio/stingers/reward_stinger',
    category: 'stinger',
    loop: false,
    volume: 0.7,
    bus: 'music',
    style: 'modern',
    mood: 'reward',
    description: 'Short celebratory cue when quest is completed',
  },
  {
    key: 'upgrade_unlock',
    path: '/game/audio/stingers/upgrade_unlock',
    category: 'stinger',
    loop: false,
    volume: 0.7,
    bus: 'music',
    style: 'modern',
    mood: 'reward',
    description: 'Short exciting upgrade unlock cue',
  },
  {
    key: 'reward_tarabi_stinger',
    path: '/game/audio/stingers/reward_tarabi_stinger',
    category: 'stinger',
    loop: false,
    volume: 0.7,
    bus: 'music',
    style: 'arabic-inspired',
    mood: 'reward',
    description: 'Bright celebratory cue — qanun/oud/string sparkle; satisfying and memorable',
  },
  {
    key: 'upgrade_unlock_hybrid',
    path: '/game/audio/stingers/upgrade_unlock_hybrid',
    category: 'stinger',
    loop: false,
    volume: 0.7,
    bus: 'music',
    style: 'hybrid',
    mood: 'reward',
    description: 'Exciting but elegant — mechanical + musical flourish; modern hit with Arabic-inspired ornament',
  },
];

// ---------------------------------------------------------------------------
// Ambient — looping environmental layers
// ---------------------------------------------------------------------------
export const AMBIENT = [
  {
    key: 'neighborhood_ambience',
    path: '/game/audio/ambient/neighborhood_ambience',
    category: 'ambient',
    loop: true,
    volume: 0.3,
    bus: 'ambient',
    style: 'modern',
    mood: 'ambient',
    description: 'Light neighborhood outdoor ambience — distant birds, soft wind',
  },
  {
    key: 'garage_ambience',
    path: '/game/audio/ambient/garage_ambience',
    category: 'ambient',
    loop: true,
    volume: 0.25,
    bus: 'ambient',
    style: 'modern',
    mood: 'ambient',
    description: 'Subtle workshop ambience — faint hum, gentle metallic tones',
  },
  {
    key: 'desert_wind',
    path: '/game/audio/ambient/desert_wind',
    category: 'ambient',
    loop: true,
    volume: 0.2,
    bus: 'ambient',
    style: 'modern',
    mood: 'ambient',
    description: 'Soft desert wind',
  },
];

// ---------------------------------------------------------------------------
// Bike / Mechanic SFX
// ---------------------------------------------------------------------------
export const SFX_BIKE = [
  { key: 'wheel_roll', path: '/game/audio/sfx/bike/wheel_roll', category: 'sfx_bike', loop: true, volume: 0.3, bus: 'sfx', style: 'modern', mood: 'ride' },
  { key: 'gravel_roll', path: '/game/audio/sfx/bike/gravel_roll', category: 'sfx_bike', loop: true, volume: 0.25, bus: 'sfx', style: 'modern', mood: 'ride' },
  { key: 'bike_stop', path: '/game/audio/sfx/bike/bike_stop', category: 'sfx_bike', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'ride' },
  { key: 'brake_tap', path: '/game/audio/sfx/bike/brake_tap', category: 'sfx_bike', loop: false, volume: 0.35, bus: 'sfx', style: 'modern', mood: 'ride' },
  { key: 'chain_click', path: '/game/audio/sfx/bike/chain_click', category: 'sfx_bike', loop: false, volume: 0.35, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'freewheel_tick', path: '/game/audio/sfx/bike/freewheel_tick', category: 'sfx_bike', loop: false, volume: 0.3, bus: 'sfx', style: 'modern', mood: 'ride' },
  { key: 'tire_pump', path: '/game/audio/sfx/bike/tire_pump', category: 'sfx_bike', loop: false, volume: 0.5, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'patch_apply', path: '/game/audio/sfx/bike/patch_apply', category: 'sfx_bike', loop: false, volume: 0.45, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'wrench_turn', path: '/game/audio/sfx/bike/wrench_turn', category: 'sfx_bike', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'ratchet_click', path: '/game/audio/sfx/bike/ratchet_click', category: 'sfx_bike', loop: false, volume: 0.35, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'toolbox_open', path: '/game/audio/sfx/bike/toolbox_open', category: 'sfx_bike', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'toolbox_close', path: '/game/audio/sfx/bike/toolbox_close', category: 'sfx_bike', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'mechanic' },
  { key: 'item_pickup', path: '/game/audio/sfx/bike/item_pickup', category: 'sfx_bike', loop: false, volume: 0.5, bus: 'sfx', style: 'modern', mood: 'reward' },
  { key: 'upgrade_install', path: '/game/audio/sfx/bike/upgrade_install', category: 'sfx_bike', loop: false, volume: 0.5, bus: 'sfx', style: 'modern', mood: 'reward' },
];

// ---------------------------------------------------------------------------
// UI SFX
// ---------------------------------------------------------------------------
export const SFX_UI = [
  { key: 'ui_hover', path: '/game/audio/sfx/ui/hover', category: 'sfx_ui', loop: false, volume: 0.2, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_tap', path: '/game/audio/sfx/ui/tap', category: 'sfx_ui', loop: false, volume: 0.35, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_panel_open', path: '/game/audio/sfx/ui/panel_open', category: 'sfx_ui', loop: false, volume: 0.3, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_panel_close', path: '/game/audio/sfx/ui/panel_close', category: 'sfx_ui', loop: false, volume: 0.3, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_notebook_open', path: '/game/audio/sfx/ui/notebook_open', category: 'sfx_ui', loop: false, volume: 0.3, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_quest_accept', path: '/game/audio/sfx/ui/quest_accept', category: 'sfx_ui', loop: false, volume: 0.5, bus: 'sfx', style: 'modern', mood: 'quest' },
  { key: 'ui_quest_complete', path: '/game/audio/sfx/ui/quest_complete', category: 'sfx_ui', loop: false, volume: 0.55, bus: 'sfx', style: 'modern', mood: 'reward' },
  { key: 'ui_error', path: '/game/audio/sfx/ui/error', category: 'sfx_ui', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'ui' },
  { key: 'ui_success', path: '/game/audio/sfx/ui/success', category: 'sfx_ui', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'ui' },
];

// ---------------------------------------------------------------------------
// World / Character SFX
// ---------------------------------------------------------------------------
export const SFX_WORLD = [
  { key: 'footstep', path: '/game/audio/sfx/world/footstep', category: 'sfx_world', loop: false, volume: 0.25, bus: 'sfx', style: 'modern', mood: 'world' },
  { key: 'interaction_ping', path: '/game/audio/sfx/world/interaction_ping', category: 'sfx_world', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'world' },
  { key: 'object_inspect', path: '/game/audio/sfx/world/object_inspect', category: 'sfx_world', loop: false, volume: 0.35, bus: 'sfx', style: 'modern', mood: 'world' },
  { key: 'door_interact', path: '/game/audio/sfx/world/door_interact', category: 'sfx_world', loop: false, volume: 0.4, bus: 'sfx', style: 'modern', mood: 'world' },
  { key: 'collectible_pickup', path: '/game/audio/sfx/world/collectible_pickup', category: 'sfx_world', loop: false, volume: 0.5, bus: 'sfx', style: 'modern', mood: 'reward' },
  { key: 'checkpoint_ping', path: '/game/audio/sfx/world/checkpoint_ping', category: 'sfx_world', loop: false, volume: 0.45, bus: 'sfx', style: 'modern', mood: 'world' },
];

// ---------------------------------------------------------------------------
// Combined manifest (flat array for preloading)
// ---------------------------------------------------------------------------
export const ALL_ASSETS = [
  ...MUSIC,
  ...STINGERS,
  ...AMBIENT,
  ...SFX_BIKE,
  ...SFX_UI,
  ...SFX_WORLD,
];

/** Quick lookup by key */
export const ASSET_MAP = Object.fromEntries(ALL_ASSETS.map((a) => [a.key, a]));

// ---------------------------------------------------------------------------
// Scene → default track mappings
//
// Each scene has a primary and an optional alternate (Arabic-inspired or
// hybrid). The game can choose between them based on context or progression.
// ---------------------------------------------------------------------------
// NOTE: 'desert_discovery' has no real audio file on disk (only a 0-byte
// placeholder .ogg). Any scene that mapped to it used to go silent after the
// fade-out. Remapped those to tracks that actually exist, and added the
// sub-scenes (copper mine / desert foraging / salt river / world map) that
// were missing entirely — without an entry here, AudioManager.transitionToScene
// silently keeps the previous scene's music, which breaks when the previous
// scene was WorldMap.
export const SCENE_MUSIC = {
  GarageScene: 'pixel_pedal_parade_v4',
  ZuzuGarageScene: 'pixel_pedal_parade_v4',
  NeighborhoodScene: 'pixel_pedal_parade_v2',
  OverworldScene: 'pixel_pedal_parade_v2',
  StreetBlockScene: 'pixel_pedal_parade_v2',
  DogParkScene: 'neighborhood_hybrid_ride',
  LakeEdgeScene: 'warm_hands_quiet_gears',
  SportsFieldsScene: 'neighborhood_hybrid_ride',
  CommunityPoolScene: 'neighborhood_hybrid_ride',
  DesertTrailScene: 'qanun_jar_lid',
  MountainScene: 'qanun_jar_lid',
  // Sub-scenes under BaseSubScene
  WorldMapScene: 'quest_focus_hybrid',
  CopperMineScene: 'qanun_jar_lid',
  DesertForagingScene: 'qanun_jar_lid',
  SaltRiverScene: 'warm_hands_quiet_gears',
  DryWashScene: 'pyramid_sandwalk',
};

export const SCENE_MUSIC_ALT = {
  GarageScene: 'warm_hands_quiet_gears',
  ZuzuGarageScene: 'warm_hands_quiet_gears',
  NeighborhoodScene: 'neighborhood_hybrid_ride',
  OverworldScene: 'neighborhood_hybrid_ride',
  StreetBlockScene: 'neighborhood_hybrid_ride',
};

export const SCENE_AMBIENT = {
  GarageScene: 'garage_ambience',
  ZuzuGarageScene: 'garage_ambience',
  NeighborhoodScene: 'neighborhood_ambience',
  OverworldScene: 'neighborhood_ambience',
  StreetBlockScene: 'neighborhood_ambience',
  DogParkScene: 'neighborhood_ambience',
};

// ---------------------------------------------------------------------------
// Query helpers — find assets by style, mood, or both
// ---------------------------------------------------------------------------

/**
 * Return all assets matching a given style.
 * @param {'modern'|'arabic-inspired'|'hybrid'} style
 */
export function findByStyle(style) {
  return ALL_ASSETS.filter((a) => a.style === style);
}

/**
 * Return all assets matching a given mood.
 * @param {string} mood — e.g. 'garage', 'ride', 'discovery', 'quest', 'reward'
 */
export function findByMood(mood) {
  return ALL_ASSETS.filter((a) => a.mood === mood);
}

/**
 * Return all assets matching both style and mood.
 * @param {'modern'|'arabic-inspired'|'hybrid'} style
 * @param {string} mood
 */
export function findByStyleAndMood(style, mood) {
  return ALL_ASSETS.filter((a) => a.style === style && a.mood === mood);
}

/**
 * Return all music tracks (category === 'music') for a given style.
 * Useful for building playlists or scene-overrides by feel.
 * @param {'modern'|'arabic-inspired'|'hybrid'} style
 */
export function getMusicByStyle(style) {
  return MUSIC.filter((a) => a.style === style);
}

/**
 * Return all stingers for a given style.
 * @param {'modern'|'arabic-inspired'|'hybrid'} style
 */
export function getStingersByStyle(style) {
  return STINGERS.filter((a) => a.style === style);
}
