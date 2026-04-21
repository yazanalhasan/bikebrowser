/**
 * Neighborhood World Layout — structured data for the outdoor map.
 *
 * Source image: public/game/maps/neighborhood_world_v1.png (1536×1024)
 *
 * All coordinates are in world-space pixels matching the map image.
 * The map uses a 3:2 aspect ratio. The Phaser world bounds are set
 * to match the image dimensions so the map is pixel-accurate.
 *
 * Layout reference (approximate quadrants):
 *
 *   ┌──────────────────┬───────────────────┐
 *   │  Zuzu's Garage   │   Lake Edge       │
 *   │  + Neighborhood  │   + Mountains     │
 *   │                  │   Sports Fields → │
 *   ├──────────────────┼───────────────────┤
 *   │  Dog Park        │   Pool            │
 *   │  + Houses        │   + Houses        │
 *   │  Desert Trails ← │   Desert Trails → │
 *   └──────────────────┴───────────────────┘
 *
 * Major roads form a cross at roughly (640, 470).
 */

// ---------------------------------------------------------------------------
// World dimensions (match the map image)
// ---------------------------------------------------------------------------
export const WORLD = {
  width: 1536,
  height: 1024,
  mapAsset: 'neighborhood_world_v1',
  mapPath: 'game/maps/neighborhood_world_v1.png',
};

// ---------------------------------------------------------------------------
// Spawn & transition points
// ---------------------------------------------------------------------------
export const SPAWNS = {
  /** Where the player appears when entering from the garage. */
  fromGarage: { x: 280, y: 280 },

  /** Default outdoor spawn for first-time / fallback. */
  default: { x: 640, y: 500 },
};

/** Transition zone back to the garage scene. */
export const GARAGE_TRANSITION = {
  x: 240,
  y: 190,
  width: 120,
  height: 50,
  label: '🏠 Go Home',
  targetScene: 'GarageScene',
  targetSpawn: { x: 400, y: 340 },
};

// ---------------------------------------------------------------------------
// Landmarks — named regions on the map
// ---------------------------------------------------------------------------
/**
 * Each landmark defines:
 *   id       — unique key for quests/code references
 *   name     — display name
 *   icon     — emoji for labels and UI
 *   x, y     — center point in world coordinates
 *   width, height — bounding box
 *   purpose  — what this area is for (flavor + future quest hooks)
 *   walkable — whether the player can walk freely inside
 *   showLabel — whether to show a floating label in-game
 */
export const LANDMARKS = [
  {
    id: 'garage_home',
    name: "Zuzu's Garage",
    icon: '🏠',
    x: 250, y: 230,
    width: 160, height: 120,
    purpose: 'Home base — bike repairs, upgrades, notebook',
    walkable: true,
    showLabel: true,
  },
  {
    id: 'dog_park',
    name: 'Dog Park',
    icon: '🐕',
    x: 270, y: 700,
    width: 200, height: 160,
    purpose: 'Fenced park — future pet/fetch quests, social area',
    walkable: true,
    showLabel: true,
  },
  {
    id: 'lake_edge',
    name: 'Lake Edge',
    icon: '🏞️',
    x: 770, y: 140,
    width: 280, height: 180,
    purpose: 'Lake with dock — future boat/water quests (Era 2)',
    walkable: false,    // water is not walkable
    showLabel: true,
  },
  {
    id: 'mountain',
    name: 'Desert Mountain',
    icon: '⛰️',
    x: 1150, y: 80,
    width: 400, height: 160,
    purpose: 'Mountain range — future trail/cave exploration',
    walkable: false,    // cliffs/rocks not walkable
    showLabel: true,
  },
  {
    id: 'sports_fields',
    name: 'Sports Fields',
    icon: '⚽',
    x: 1280, y: 380,
    width: 240, height: 260,
    purpose: 'Tennis court + soccer field — future sports/fitness quests',
    walkable: true,
    showLabel: true,
  },
  {
    id: 'pool',
    name: 'Community Pool',
    icon: '🏊',
    x: 1100, y: 720,
    width: 180, height: 140,
    purpose: 'Pool with slide — future swimming/water safety quests',
    walkable: false,    // water
    showLabel: true,
  },
  {
    id: 'desert_trail_east',
    name: 'Desert Trail',
    icon: '🌵',
    x: 1450, y: 700,
    width: 120, height: 300,
    purpose: 'Eastern trail into the desert — future exploration content',
    walkable: true,
    showLabel: true,
  },
  {
    id: 'desert_trail_south',
    name: 'Trailside Path',
    icon: '🥾',
    x: 760, y: 980,
    width: 500, height: 60,
    purpose: 'Southern trail along the bottom — connects east/west',
    walkable: true,
    showLabel: false,
  },
  {
    id: 'main_intersection',
    name: 'Main Intersection',
    icon: '🛣️',
    x: 640, y: 470,
    width: 140, height: 140,
    purpose: 'Central crossroads — roads go N/S and E/W',
    walkable: true,
    showLabel: false,
  },
  {
    id: 'neighborhood_houses_nw',
    name: 'Northwest Houses',
    icon: '🏘️',
    x: 450, y: 260,
    width: 200, height: 160,
    purpose: 'Residential — Mrs. Ramirez, other neighbors',
    walkable: true,
    showLabel: false,
  },
  {
    id: 'neighborhood_houses_se',
    name: 'Southeast Houses',
    icon: '🏘️',
    x: 900, y: 650,
    width: 200, height: 140,
    purpose: 'Residential — Mr. Chen, other neighbors',
    walkable: true,
    showLabel: false,
  },
];

/** Quick lookup by id. */
export const LANDMARK_MAP = Object.fromEntries(
  LANDMARKS.map((lm) => [lm.id, lm])
);

// ---------------------------------------------------------------------------
// NPC placements
// ---------------------------------------------------------------------------
export const NPC_PLACEMENTS = [
  {
    id: 'mrs_ramirez',
    name: 'Mrs. Ramirez',
    x: 480, y: 300,
    color: 0xb45309,
    landmark: 'neighborhood_houses_nw',
    questId: 'flat_tire_repair',
    bikeOffset: { x: 48, y: 5 },
  },
  {
    id: 'mr_chen',
    name: 'Mr. Chen',
    x: 880, y: 680,
    color: 0x2563eb,
    landmark: 'neighborhood_houses_se',
    questId: 'chain_repair',
    bikeOffset: { x: 45, y: 5 },
  },
];

// ---------------------------------------------------------------------------
// No-walk / collision zones (simplified rectangles)
// ---------------------------------------------------------------------------
/**
 * Areas the player cannot walk into. These create invisible static
 * physics bodies that block movement.
 */
export const COLLISION_ZONES = [
  // Lake water
  { id: 'lake_water', x: 770, y: 110, width: 240, height: 110 },
  // Mountain rocks (upper right)
  { id: 'mountain_rocks', x: 1150, y: 40, width: 400, height: 100 },
  // Pool water
  { id: 'pool_water', x: 1100, y: 720, width: 140, height: 90 },
];

// ---------------------------------------------------------------------------
// World boundary insets (keep player on the map)
// ---------------------------------------------------------------------------
export const BOUNDARY_PADDING = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

// ---------------------------------------------------------------------------
// Camera config
// ---------------------------------------------------------------------------
export const CAMERA = {
  /** How tightly the camera follows the player (0 = instant, 1 = very slow). */
  lerpX: 0.08,
  lerpY: 0.08,
  /** Deadzone — player can move this much before camera starts following. */
  deadzoneWidth: 80,
  deadzoneHeight: 60,
};

// ---------------------------------------------------------------------------
// Save compatibility
// ---------------------------------------------------------------------------
/**
 * Old saves used viewport-relative coords (roughly 0–800 x 0–600 range).
 * This helper detects and remaps them to the new world coordinates.
 */
export function remapLegacyPosition(pos) {
  if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    return SPAWNS.default;
  }

  // Old scene used viewport coords: ~0-800 wide, ~0-600 tall.
  // If both coords fit inside the old viewport range, remap proportionally.
  const looksLegacy = pos.x < 900 && pos.y < 700 && pos.x > 0 && pos.y > 0;

  if (looksLegacy) {
    // Scale from old ~800×600 viewport to new 1536×1024 world
    return {
      x: Math.round((pos.x / 800) * WORLD.width),
      y: Math.round((pos.y / 600) * WORLD.height),
    };
  }

  // Already in new world coords — just clamp to bounds
  return {
    x: Math.max(BOUNDARY_PADDING.left, Math.min(WORLD.width - BOUNDARY_PADDING.right, pos.x)),
    y: Math.max(BOUNDARY_PADDING.top, Math.min(WORLD.height - BOUNDARY_PADDING.bottom, pos.y)),
  };
}

// ---------------------------------------------------------------------------
// Debug helpers
// ---------------------------------------------------------------------------

/**
 * Draw a debug overlay showing all landmarks, NPCs, collision zones,
 * and world bounds. Enable during development by calling from create().
 *
 * @param {Phaser.Scene} scene
 */
export function drawDebugWorld(scene) {
  const g = scene.add.graphics().setDepth(998).setAlpha(0.35);

  // World bounds outline
  g.lineStyle(3, 0xff0000, 0.8);
  g.strokeRect(0, 0, WORLD.width, WORLD.height);

  // Landmarks
  LANDMARKS.forEach((lm) => {
    const color = lm.walkable ? 0x00ff00 : 0xff4444;
    g.lineStyle(2, color, 0.7);
    g.strokeRect(lm.x - lm.width / 2, lm.y - lm.height / 2, lm.width, lm.height);

    scene.add.text(lm.x, lm.y - lm.height / 2 - 10, `${lm.icon} ${lm.id}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(999);
  });

  // Collision zones
  g.fillStyle(0xff0000, 0.15);
  COLLISION_ZONES.forEach((cz) => {
    g.fillRect(cz.x - cz.width / 2, cz.y - cz.height / 2, cz.width, cz.height);
    g.lineStyle(1, 0xff0000, 0.5);
    g.strokeRect(cz.x - cz.width / 2, cz.y - cz.height / 2, cz.width, cz.height);
  });

  // NPC markers
  NPC_PLACEMENTS.forEach((npc) => {
    g.fillStyle(npc.color, 0.5);
    g.fillCircle(npc.x, npc.y, 12);
    scene.add.text(npc.x, npc.y + 16, npc.id, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffff00',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 2, y: 1 },
    }).setOrigin(0.5).setDepth(999);
  });

  // Spawn points
  [SPAWNS.fromGarage, SPAWNS.default].forEach((sp, i) => {
    g.fillStyle(0x00ffff, 0.6);
    g.fillCircle(sp.x, sp.y, 8);
    scene.add.text(sp.x, sp.y - 14, i === 0 ? 'spawn:garage' : 'spawn:default', {
      fontSize: '9px', fontFamily: 'monospace', color: '#00ffff',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 2, y: 1 },
    }).setOrigin(0.5).setDepth(999);
  });

  // Garage transition zone
  const gt = GARAGE_TRANSITION;
  g.fillStyle(0xffaa00, 0.2);
  g.fillRect(gt.x - gt.width / 2, gt.y - gt.height / 2, gt.width, gt.height);
  g.lineStyle(2, 0xffaa00, 0.6);
  g.strokeRect(gt.x - gt.width / 2, gt.y - gt.height / 2, gt.width, gt.height);

  return g;
}
