/**
 * Physics Bridge — connects Phaser Arcade physics to MCP observation
 * and adds camera gameplay effects.
 *
 * IMPORTANT: The game uses Arcade physics (top-down, zero gravity).
 * Matter.js is NOT enabled because:
 *   - 16+ existing Arcade calls across 10 files
 *   - Player movement is velocity-based, not force-based
 *   - Top-down games don't need gravity
 *   - Switching would break every scene, NPC, wall, and exit zone
 *
 * Instead, this module:
 *   1. Observes Arcade physics state for MCP
 *   2. Adds camera effects (shake, flash, zoom) for gameplay events
 *   3. Provides a physics data feed for the stress simulation system
 *   4. Bridges physics events to MCP event bus
 *
 * If Matter.js is ever needed for a specific sub-system (vehicle builder),
 * it can be added as a SECONDARY physics system in a dedicated scene
 * without touching the core Arcade-based gameplay.
 */

// ── Physics Observation for MCP ──────────────────────────────────────────────

/**
 * Gather physics state from the Phaser scene for MCP observation.
 * Called by MCP.observe() each tick.
 *
 * @param {Phaser.Scene} scene
 * @returns {object} physics snapshot
 */
export function getPhysicsState(scene) {
  const player = scene.player;
  const sprite = player?.sprite;
  const body = sprite?.body;

  if (!body) return null;

  return {
    playerVelocity: {
      x: Math.round(body.velocity.x),
      y: Math.round(body.velocity.y),
    },
    playerSpeed: Math.round(Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2)),
    playerPosition: {
      x: Math.round(sprite.x),
      y: Math.round(sprite.y),
    },
    isMoving: Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5,
    collidingWithWorld: body.blocked.up || body.blocked.down || body.blocked.left || body.blocked.right,
    blocked: { ...body.blocked },
    touching: { ...body.touching },
  };
}

/**
 * Compute estimated stress from player movement.
 * Uses velocity and mass analog for the material system.
 *
 * @param {object} physicsState
 * @returns {{ kineticStress, impactRisk, movementForce }}
 */
export function computeMovementStress(physicsState) {
  if (!physicsState) return { kineticStress: 0, impactRisk: 0, movementForce: 0 };

  const speed = physicsState.playerSpeed;
  const maxSpeed = 300; // from Player.js SPEED constant

  // Kinetic stress: normalized speed
  const kineticStress = Math.min(1, speed / maxSpeed);

  // Impact risk: high when player is blocked while moving fast
  const isBlocked = physicsState.collidingWithWorld;
  const impactRisk = isBlocked && speed > 100 ? (speed / maxSpeed) * 0.5 : 0;

  // Movement force analog
  const movementForce = speed / maxSpeed;

  return {
    kineticStress: Math.round(kineticStress * 100) / 100,
    impactRisk: Math.round(impactRisk * 100) / 100,
    movementForce: Math.round(movementForce * 100) / 100,
  };
}

// ── Camera Effects ───────────────────────────────────────────────────────────

/**
 * Shake camera on impact/failure.
 * @param {Phaser.Scene} scene
 * @param {number} [duration=200] ms
 * @param {number} [intensity=0.008]
 */
export function cameraShake(scene, duration = 200, intensity = 0.008) {
  scene.cameras.main.shake(duration, intensity);
}

/**
 * Flash camera on damage.
 * @param {Phaser.Scene} scene
 * @param {number} [duration=150]
 * @param {number} r - red 0–255
 * @param {number} g - green
 * @param {number} b - blue
 */
export function cameraFlash(scene, duration = 150, r = 255, g = 80, b = 80) {
  scene.cameras.main.flash(duration, r, g, b, false);
}

/**
 * Pan camera to a point of interest.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} [duration=500]
 * @param {function} [onComplete]
 */
export function cameraPanTo(scene, x, y, duration = 500, onComplete) {
  scene.cameras.main.pan(x, y, duration, 'Power2', false, (_cam, progress) => {
    if (progress >= 1 && onComplete) onComplete();
  });
}

/**
 * Zoom camera for region-specific framing.
 * @param {Phaser.Scene} scene
 * @param {number} zoom - 0.8 to 1.5
 * @param {number} [duration=300]
 */
export function cameraZoom(scene, zoom, duration = 300) {
  scene.cameras.main.zoomTo(zoom, duration);
}

/**
 * Reset camera to default follow behavior.
 */
export function cameraResetFollow(scene) {
  if (scene.player?.sprite) {
    scene.cameras.main.startFollow(scene.player.sprite, true, 0.1, 0.1);
    scene.cameras.main.zoomTo(1, 300);
  }
}

// ── MCP Event-Driven Camera Effects ──────────────────────────────────────────

/**
 * Wire MCP events to camera effects.
 * Call once in scene create() after MCP is initialized.
 *
 * @param {Phaser.Scene} scene
 * @param {object} mcp
 */
export function wireCameraToMCP(scene, mcp) {
  if (!mcp) return;

  // Obstacle damage → red flash
  mcp.on('OBSTACLE_FAILED_REPEATEDLY', () => {
    cameraFlash(scene, 200, 255, 100, 100);
  });

  // Player low health → subtle red pulse
  mcp.on('PLAYER_LOW_HEALTH', () => {
    cameraFlash(scene, 300, 200, 50, 50);
  });

  // Quest completed → celebratory white flash
  mcp.on('QUEST_COMPLETED', () => {
    cameraFlash(scene, 400, 255, 255, 255);
    cameraShake(scene, 100, 0.003); // gentle celebration shake
  });

  // High-speed collision → shake
  mcp.on('PHYSICS_IMPACT', (payload) => {
    const intensity = Math.min(0.02, (payload.force || 0.5) * 0.015);
    cameraShake(scene, 150, intensity);
  });

  // New region entered → zoom adjust
  mcp.on('NEW_BIOME_ENTERED', (payload) => {
    // Dense regions get slight zoom-in
    const zoomMap = {
      desert_scrub: 1.0,
      sonoran_desert: 1.0,
      woodland: 1.05,
      riparian: 1.05,
      chaparral: 1.0,
    };
    const zoom = zoomMap[payload.biome] || 1.0;
    cameraZoom(scene, zoom, 500);
  });
}
