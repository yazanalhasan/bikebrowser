/**
 * MCP (Master Control Program) — core runtime orchestrator.
 *
 * Lives inside the Phaser game loop. Coordinates all game systems
 * without replacing their internal logic. Pure orchestration:
 *
 *   observe() → gather state from player, environment, systems
 *   coordinate() → detect cross-system conditions, notify systems
 *   react() → trigger adaptive behaviors, assistant hints, learning
 *
 * Runs every frame via scene.update(). Registered systems are called
 * through safe optional access — missing systems never cause crashes.
 *
 * Event bus provides cross-system communication without tight coupling.
 *
 * Integration point: LocalSceneBase.create() + update()
 */

import { getEnvironment } from './ecologyEngine.js';
import { computeForagingRisk, detectForageables } from './foragingSystem.js';
import { getPhysicsState, computeMovementStress } from './physicsbridge.js';
import { initAISystem } from './ai/MCPAIAdapter.js';
import PhysicsEducationSystem from './education/physicsEducationSystem.js';
import { canShowQuestion, shouldDismissQuestion, setBusy } from './gameplayArbiter.js';

// ── MCP System Class ─────────────────────────────────────────────────────────

export default class MCPSystem {
  /**
   * @param {Phaser.Scene} scene - the owning Phaser scene
   */
  constructor(scene) {
    this.scene = scene;
    this.systems = {};
    this.state = {};
    this.events = new Map();
    this.lastTick = 0;
    this.tickCount = 0;

    // Throttle: observation runs every N frames, not every frame
    this._observeInterval = 6;  // ~10 times/sec at 60fps
    this._coordinateInterval = 12; // ~5 times/sec
    this._reactInterval = 30;   // ~2 times/sec

    this.debug = {
      enabled: false,
      recentEvents: [],
      snapshots: [],
      maxEvents: 100,
      maxSnapshots: 10,
    };
  }

  // ── System Registration ────────────────────────────────────────────────────

  /**
   * Register a system with MCP.
   * Systems can optionally implement setMCP(mcp) to receive a back-reference.
   */
  register(name, system) {
    if (!name || !system) return;
    this.systems[name] = system;
    if (typeof system.setMCP === 'function') {
      system.setMCP(this);
    }
    if (this.debug.enabled) {
      console.log(`[MCP] Registered: ${name}`);
    }
  }

  unregister(name) {
    delete this.systems[name];
  }

  getSystem(name) {
    return this.systems[name] || null;
  }

  getRegisteredSystems() {
    return Object.keys(this.systems);
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  /**
   * Initialize MCP state. Called once in scene.create().
   */
  init(initialState = {}) {
    this.state = {
      sceneKey: initialState.sceneKey || this.scene.scene?.key || 'unknown',
      player: {
        x: 0, y: 0, velocityX: 0, velocityY: 0,
        isMoving: false, facing: 'down',
        health: 1, stamina: 1, hydration: 0.8, toxicity: 0, focus: 1,
        nearPlant: false, nearNPC: false, nearMaterial: false,
        nearestPlantSpecies: null, nearestNPCId: null,
      },
      environment: {
        biome: 'desert_scrub',
        temperature: 0.3,
        moisture: 0.1,
        elevation: 1200,
        timeOfDay: 'day',
        fluidType: 'dry',
        contaminationLevel: 0,
      },
      systems: {},
      alerts: [],
      lastQuestEvent: null,
      ...initialState,
    };

    this.tickCount = 0;
    this.lastTick = 0;

    // Auto-register AI adapter (uses existing pipeline: window.api.ai.orchestrate)
    if (!this.systems.ai) {
      this.register('ai', initAISystem());
    }
    // Auto-register physics education
    if (!this.systems.physics_education) {
      this.register('physics_education', new PhysicsEducationSystem());
    }
  }

  // ── Per-Frame Update ───────────────────────────────────────────────────────

  /**
   * Called every frame from scene.update().
   * Throttled phases prevent performance overhead.
   */
  update(delta, time) {
    this.lastTick = time ?? performance.now();
    this.tickCount++;

    // Observe: gather state (throttled)
    if (this.tickCount % this._observeInterval === 0) {
      this.observe();
    }

    // Coordinate: cross-system interactions (throttled)
    if (this.tickCount % this._coordinateInterval === 0) {
      this.coordinate(delta);
    }

    // React: adaptive behaviors (throttled)
    if (this.tickCount % this._reactInterval === 0) {
      this.react(delta);
    }
  }

  // ── Phase 1: Observation ───────────────────────────────────────────────────

  observe() {
    const scene = this.scene;

    // ── Player state ──
    const player = scene.player;
    const sprite = player?.sprite;
    const body = sprite?.body;

    if (player) {
      const vx = body?.velocity?.x || 0;
      const vy = body?.velocity?.y || 0;
      this.state.player.x = sprite?.x || 0;
      this.state.player.y = sprite?.y || 0;
      this.state.player.velocityX = vx;
      this.state.player.velocityY = vy;
      this.state.player.isMoving = Math.abs(vx) > 5 || Math.abs(vy) > 5;
      this.state.player.facing = player.facing || 'down';
      this.state.player.speed = Math.sqrt(vx * vx + vy * vy);
    }

    // ── Physics state (from Arcade engine) ──
    const physics = getPhysicsState(scene);
    if (physics) {
      this.state.physics = physics;
      this.state.physics.stress = computeMovementStress(physics);

      // Feed physics education system with real movement data
      const physEd = this.systems.physics_education;
      if (physEd) {
        physEd.tick(this._observeInterval / 60, physics); // approximate delta in seconds
        // Bridge HUD data to registry for React
        if (scene.registry && this.tickCount % 30 === 0) {
          scene.registry.set('physicsHUD', physEd.getHUDData());
        }
        // Auto-dismiss active question if player becomes busy or starts moving
        if (physEd.activeQuestion && shouldDismissQuestion(this.state.player.isMoving)) {
          physEd.activeQuestion = null;
          scene.registry.set('physicsQuestion', null);
        }
        // Periodically check if a question should be asked
        // Gated by gameplay arbiter: player must be idle, not busy, cooldown elapsed
        if (this.tickCount % 120 === 0
            && !this.state.player.isMoving
            && canShowQuestion()
            && physEd.shouldAskQuestion()) {
          const question = physEd.generateQuestion();
          if (question) {
            scene.registry.set('physicsQuestion', question);
          }
        }
      }
    }

    // ── Player stats (from save state) ──
    const gameState = scene.registry?.get?.('gameState');
    if (gameState?.stats) {
      this.state.player.health = gameState.stats.health ?? 1;
      this.state.player.stamina = gameState.stats.stamina ?? 1;
      this.state.player.hydration = gameState.stats.hydration ?? 0.8;
      this.state.player.toxicity = gameState.stats.toxicity ?? 0;
      this.state.player.focus = gameState.stats.focus ?? 1;
    }

    // ── Environment (from ecology engine) ──
    if (sprite) {
      try {
        const env = getEnvironment(sprite.x, sprite.y, this.state.environment.timeOfDay);
        this.state.environment.biome = env.biomeType || 'desert_scrub';
        this.state.environment.temperature = env.temperature;
        this.state.environment.moisture = env.moisture;
        this.state.environment.elevation = env.elevation;
        if (env.scientificProperties) {
          this.state.environment.fluidType = env.scientificProperties.fluidType;
          this.state.environment.contaminationLevel = env.scientificProperties.contaminationLevel;
          this.state.environment.signalNoise = env.scientificProperties.signalNoise;
          this.state.environment.topologyState = env.scientificProperties.topologyState;
        }
      } catch { /* ecology engine not available in this scene */ }
    }

    // ── NPC proximity ──
    const npcs = scene._npcs ? Object.values(scene._npcs) : [];
    let nearNPC = false;
    let nearestNPCId = null;
    for (const npc of npcs) {
      if (npc.isNearby?.()) {
        nearNPC = true;
        nearestNPCId = npc.id;
        break;
      }
    }
    this.state.player.nearNPC = nearNPC;
    this.state.player.nearestNPCId = nearestNPCId;

    // ── Plant proximity (ecology objects) ──
    const ecologyPlants = scene._ecologyPlants || [];
    if (ecologyPlants.length > 0 && sprite) {
      const nearby = detectForageables(sprite.x, sprite.y, ecologyPlants);
      this.state.player.nearPlant = nearby.length > 0;
      this.state.player.nearestPlantSpecies = nearby[0]?.species || null;
    } else {
      this.state.player.nearPlant = false;
      this.state.player.nearestPlantSpecies = null;
    }

    // ── Quest state ──
    if (gameState) {
      this.state.quest = {
        activeQuestId: gameState.activeQuest?.id || null,
        activeStepIndex: gameState.activeQuest?.stepIndex || 0,
        completedCount: gameState.completedQuests?.length || 0,
        zuzubucks: gameState.zuzubucks || 0,
        reputation: gameState.reputation || 0,
      };
    }

    // ── System snapshots ──
    this.state.systems = {};
    for (const [name, sys] of Object.entries(this.systems)) {
      if (typeof sys.getSnapshot === 'function') {
        this.state.systems[name] = sys.getSnapshot();
      } else {
        this.state.systems[name] = { registered: true };
      }
    }

    // Debug snapshot
    if (this.debug.enabled && this.tickCount % 60 === 0) {
      this.debug.snapshots.push({
        tick: this.tickCount,
        time: this.lastTick,
        player: { ...this.state.player },
        environment: { ...this.state.environment },
      });
      if (this.debug.snapshots.length > this.debug.maxSnapshots) {
        this.debug.snapshots.shift();
      }
    }
  }

  // ── Phase 2: Coordination ──────────────────────────────────────────────────

  coordinate(delta) {
    const { player, environment } = this.state;

    // ── Heat exposure → notify systems ──
    if (environment.temperature > 0.6) {
      this.emit('ENV_HEAT_HIGH', { temperature: environment.temperature });
    }

    // ── Forage availability ──
    if (player.nearPlant && !this._lastForageState) {
      this.emit('FORAGE_AVAILABLE', {
        x: player.x,
        y: player.y,
        species: player.nearestPlantSpecies,
      });
    }
    this._lastForageState = player.nearPlant;

    // ── NPC proximity ──
    if (player.nearNPC && !this._lastNPCState) {
      this.emit('NPC_NEARBY', {
        npcId: player.nearestNPCId,
        x: player.x,
        y: player.y,
      });
    }
    this._lastNPCState = player.nearNPC;

    // ── Low health/stamina/hydration ──
    if (player.health < 0.25) {
      this.emit('PLAYER_LOW_HEALTH', { health: player.health });
    }
    if (player.stamina < 0.15) {
      this.emit('PLAYER_LOW_STAMINA', { stamina: player.stamina });
    }
    if (player.hydration < 0.2) {
      this.emit('PLAYER_DEHYDRATED', { hydration: player.hydration });
    }

    // ── High toxicity ──
    if (player.toxicity > 0.5) {
      this.emit('PLAYER_TOXIC', { toxicity: player.toxicity });
    }

    // ── Non-Newtonian fluid zone ──
    if (environment.fluidType === 'non_newtonian') {
      this.emit('FLUID_ZONE_ACTIVE', {
        type: environment.fluidType,
        playerSpeed: player.speed || 0,
      });
    }

    // ── Topology zone ──
    if (environment.topologyState && environment.topologyState !== 'normal') {
      this.emit('TOPOLOGY_ZONE_ACTIVE', {
        state: environment.topologyState,
      });
    }

    // ── High contamination area ──
    if (environment.contaminationLevel > 0.3) {
      this.emit('CONTAMINATION_HIGH', {
        level: environment.contaminationLevel,
      });
    }
  }

  // ── Phase 3: Reaction ──────────────────────────────────────────────────────

  react(delta) {
    const { player, environment } = this.state;

    // MCP react is ORCHESTRATION ONLY.
    // It emits events. The AI adapter (registered via _wireEvents) handles them.
    // Deterministic alerts are pushed directly. AI-enhanced responses come via events.

    // ── Listen for AI results and surface them as alerts ──
    // (one-time wiring, idempotent)
    if (!this._aiWired) {
      this.on('AI_HINT', (result) => {
        if (result?.hint) this._pushAlert('ai_hint', result.hint, result.priority === 'high' ? 'warning' : 'info');
      });
      this.on('AI_FAILURE_EXPLAINED', (result) => {
        if (result?.summary) this._pushAlert('ai_failure', result.summary, 'warning');
      });
      this.on('AI_QUEST_GUIDANCE', (result) => {
        if (result?.goal) this._pushAlert('ai_quest', result.goal, 'info');
      });
      this.on('AI_LANGUAGE_REINFORCED', (result) => {
        if (result?.context) this._pushAlert('ai_language', result.context, 'info');
      });
      this.on('DYNAMIC_QUEST_GENERATED', (quest) => {
        if (quest?.title) {
          this._pushAlert('dynamic_quest', `New quest: "${quest.title}" — ${quest.description || quest.learningGoal}`, 'info');
        }
      });
      // Obstacle failure → AI hint (only AFTER player has failed, never before)
      this.on('OBSTACLE_FAILED_REPEATEDLY', (payload) => {
        const systemHints = {
          crafting: 'Try crafting something useful. Check what recipes you can make.',
          foraging: 'Look for harvestable plants nearby. Walk close and press action.',
          ecology: 'Study the desert ecology. Plants have properties that solve problems.',
          materials: 'Learn about material properties. Different materials resist different forces.',
          science: 'Think about the physics. How does this substance behave under force?',
          chemistry: 'Natural chemistry can help. Some plants clean, some protect, some heal.',
          repair: 'Your repair skills from bike fixing apply here too.',
          language: 'Learn the local language. NPCs share more knowledge when you speak their words.',
          quests: 'Complete quests to earn trust and reputation.',
        };
        const hint = systemHints[payload.learnSystem] || payload.hint || 'Explore and learn more.';
        this._pushAlert('obstacle_hint',
          `${payload.obstacleLabel}: ${hint}`,
          payload.failCount >= 3 ? 'warning' : 'info');
      });
      this._aiWired = true;
    }

    // ── Deterministic edge-triggered alerts (no AI needed) ──

    if (player.health < 0.25 && !this._hintedLowHealth) {
      // Emit event → AI adapter picks it up and generates enhanced hint
      // Also push immediate deterministic alert
      this._pushAlert('low_health', 'Health is low. Find healing plants or use a crafted salve.', 'warning');
      this._hintedLowHealth = true;
    }
    if (player.health >= 0.5) this._hintedLowHealth = false;

    if (player.hydration < 0.2 && !this._hintedDehydration) {
      this._pushAlert('dehydration', 'Dehydrated! Find water or prickly pear for hydration.', 'critical');
      this._hintedDehydration = true;
    }
    if (player.hydration >= 0.4) this._hintedDehydration = false;

    if (player.toxicity > 0.5 && !this._hintedToxicity) {
      this._pushAlert('toxicity', 'Toxicity rising. Stop using toxic plants and let it decay.', 'warning');
      this._hintedToxicity = true;
    }
    if (player.toxicity < 0.3) this._hintedToxicity = false;

    if (player.nearPlant && player.nearestPlantSpecies && !this._hintedForage) {
      this._pushAlert('forage_hint', `${player.nearestPlantSpecies} nearby — press action to forage.`, 'info');
      this._hintedForage = true;
    }
    if (!player.nearPlant) this._hintedForage = false;

    if (environment.temperature > 0.7 && this.lastTick > 15000 && !this._hintedHeat) {
      this._pushAlert('heat_warning', 'Extreme heat! Seek shade or hydrate.', 'warning');
      this._hintedHeat = true;
    }
    if (environment.temperature < 0.5) this._hintedHeat = false;

    // ── Prune old alerts ──
    const now = this.lastTick;
    this.state.alerts = this.state.alerts.filter((a) => now - a.time < 10000);
  }

  // ── Alert System ───────────────────────────────────────────────────────────

  _pushAlert(id, message, severity = 'info') {
    // Don't duplicate same alert within 5 seconds
    const existing = this.state.alerts.find((a) => a.id === id);
    if (existing && this.lastTick - existing.time < 5000) return;

    const alert = {
      id,
      message,
      severity, // 'info' | 'warning' | 'critical'
      time: this.lastTick,
    };

    this.state.alerts.push(alert);
    this.emit('ALERT', alert);

    // Bridge to React UI via Phaser registry (GameContainer listens on 'changedata-mcpAlert')
    if (this.scene?.registry) {
      this.scene.registry.set('mcpAlert', alert);
    }

    if (this.debug.enabled) {
      console.log(`[MCP Alert] ${severity}: ${message}`);
    }
  }

  // ── Event Bus ──────────────────────────────────────────────────────────────

  /**
   * Emit an event to all registered listeners.
   */
  emit(event, payload = {}) {
    const handlers = this.events.get(event);

    // Debug logging
    if (this.debug.enabled || event === 'ALERT') {
      this.debug.recentEvents.push({
        event,
        payload: typeof payload === 'object' ? { ...payload } : payload,
        time: this.lastTick,
      });
      if (this.debug.recentEvents.length > this.debug.maxEvents) {
        this.debug.recentEvents.shift();
      }
    }

    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[MCP] Event handler failed for "${event}":`, err);
      }
    }
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);
    return () => {
      const set = this.events.get(event);
      if (set) set.delete(handler);
    };
  }

  // ── State Access ───────────────────────────────────────────────────────────

  getState() {
    return this.state;
  }

  getAlerts() {
    return this.state.alerts;
  }

  // ── Debug ──────────────────────────────────────────────────────────────────

  setDebug(enabled) {
    this.debug.enabled = !!enabled;
    if (enabled) {
      console.log('[MCP] Debug mode enabled');
      console.log('[MCP] Registered systems:', this.getRegisteredSystems());
      console.log('[MCP] Scene:', this.state.sceneKey);
    }
  }

  getDebugSummary() {
    return {
      sceneKey: this.state.sceneKey,
      tickCount: this.tickCount,
      registeredSystems: this.getRegisteredSystems(),
      playerPos: { x: Math.round(this.state.player.x), y: Math.round(this.state.player.y) },
      environment: this.state.environment.biome,
      temperature: this.state.environment.temperature,
      alerts: this.state.alerts.length,
      recentEvents: this.debug.recentEvents.slice(-10).map((e) => e.event),
    };
  }
}
