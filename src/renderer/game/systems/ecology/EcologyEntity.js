/**
 * EcologyEntity — runtime record produced by `registerEntity()` and
 * stored in the substrate's per-scene registry.
 *
 * Per ecology-substrate.md §3, an EcologyEntity is **not** stored in
 * `data/`; it is produced from data plus runtime context. The class
 * collects:
 *   - Required fields (id, speciesId, type, sceneKey, x, y, spawnedBy)
 *   - Optional fields with defaults (interactionRadius, observable,
 *     forageable, grantsItemId, questObservationId, inspectText,
 *     timeOfDayRule, biomeRule)
 *   - Relationship fields populated at registration (eats, eatenBy,
 *     nearbyAttractors, relationTags)
 *
 * Construction is via `new EcologyEntity(config)` where `config` is the
 * fully-resolved field bag prepared by `registerEntity()`. The class
 * itself does NOT do data lookups — that is the registration layer's
 * job. The class is a typed record + a few small lifecycle helpers.
 */

/**
 * @typedef {'flora' | 'fauna' | 'microbe'} EcologyEntityType
 * @typedef {'layout' | 'procedural' | 'biology'} EcologyEntitySpawnedBy
 * @typedef {'always' | 'fauna-default' | 'plant-default' | 'custom'} EcologyTimeOfDayRule
 * @typedef {'enforced' | 'soft' | 'ignored'} EcologyBiomeRule
 */

/**
 * Configuration bag accepted by the `EcologyEntity` constructor.
 *
 * @typedef {Object} EcologyEntityConfig
 * @property {string} id
 * @property {string} speciesId
 * @property {EcologyEntityType} type
 * @property {string} sceneKey
 * @property {number} x
 * @property {number} y
 * @property {EcologyEntitySpawnedBy} spawnedBy
 * @property {number} [interactionRadius]
 * @property {boolean} [observable]
 * @property {boolean} [forageable]
 * @property {string|null} [grantsItemId]
 * @property {string|null} [questObservationId]
 * @property {string|null} [inspectText]
 * @property {EcologyTimeOfDayRule} [timeOfDayRule]
 * @property {EcologyBiomeRule} [biomeRule]
 * @property {string[]} [eats]
 * @property {string[]} [eatenBy]
 * @property {string[]} [nearbyAttractors]
 * @property {string[]} [relationTags]
 */

export class EcologyEntity {
  /**
   * Construct an EcologyEntity from a fully-resolved config bag.
   *
   * The caller (`registerEntity`) is responsible for resolving defaults
   * and computing relationship fields BEFORE invoking the constructor.
   *
   * @param {EcologyEntityConfig} config
   */
  constructor(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('[ecology] EcologyEntity requires a config object');
    }

    // ── Required fields ─────────────────────────────────────────────
    /** @type {string} Unique within the substrate. */
    this.id = config.id;
    /** @type {string} Resolves to FLORA/FAUNA. */
    this.speciesId = config.speciesId;
    /** @type {EcologyEntityType} */
    this.type = config.type;
    /** @type {string} Phaser scene key the entity is attached to. */
    this.sceneKey = config.sceneKey;
    /** @type {number} World x. */
    this.x = config.x;
    /** @type {number} World y. */
    this.y = config.y;
    /** @type {EcologyEntitySpawnedBy} */
    this.spawnedBy = config.spawnedBy;

    // ── Optional fields (with defaults per substrate §3) ────────────
    /** @type {number} */
    this.interactionRadius = (typeof config.interactionRadius === 'number')
      ? config.interactionRadius
      : 48;
    /** @type {boolean} */
    this.observable = (typeof config.observable === 'boolean')
      ? config.observable
      : true;
    /** @type {string|null} */
    this.grantsItemId = config.grantsItemId ?? null;
    /** @type {boolean} forageable defaults true iff grantsItemId is set */
    this.forageable = (typeof config.forageable === 'boolean')
      ? config.forageable
      : (this.grantsItemId !== null);
    /** @type {string|null} */
    this.questObservationId = (typeof config.questObservationId === 'string')
      ? config.questObservationId
      : (config.questObservationId === null ? null : this.speciesId);
    /** @type {string|null} */
    this.inspectText = config.inspectText ?? null;
    /** @type {EcologyTimeOfDayRule} */
    this.timeOfDayRule = config.timeOfDayRule
      ?? (this.type === 'fauna' ? 'fauna-default' : 'always');
    /** @type {EcologyBiomeRule} */
    this.biomeRule = config.biomeRule ?? 'soft';

    // ── Relationship fields (populated at registration) ─────────────
    /** @type {string[]} For fauna: prey list. For flora: []. */
    this.eats = Array.isArray(config.eats) ? [...config.eats] : [];
    /** @type {string[]} For flora: supports list. For fauna: predator list. */
    this.eatenBy = Array.isArray(config.eatenBy) ? [...config.eatenBy] : [];
    /** @type {string[]} For flora: predatorsNearby. For fauna: []. */
    this.nearbyAttractors = Array.isArray(config.nearbyAttractors)
      ? [...config.nearbyAttractors]
      : [];
    /** @type {string[]} Composed tags ('supports:javelina', etc.). */
    this.relationTags = Array.isArray(config.relationTags)
      ? [...config.relationTags]
      : [];

    // ── Runtime-only fields (NOT serialized) ────────────────────────
    /** @type {Phaser.GameObjects.Zone | null} The interaction zone. */
    this.zone = null;
    /** @type {Phaser.GameObjects.GameObject | null} Optional sprite handle (set by scene, not by substrate). */
    this.sprite = null;
    /** @type {boolean} Whether the entity is currently active per timeOfDayRule. */
    this.active = true;
    /** @type {string|null} Most recent reason the entity was deactivated, for debugging. */
    this.inactiveReason = null;
  }

  /**
   * Returns whether the entity is currently observable. Combines the
   * static `observable` flag with the runtime `active` flag (driven by
   * `ecologyTicker` time-of-day enforcement).
   *
   * @returns {boolean}
   */
  isObservable() {
    return this.observable === true && this.active === true;
  }

  /**
   * Returns whether the entity is currently forageable. Combines the
   * static `forageable` flag with `grantsItemId` presence and the
   * runtime `active` flag.
   *
   * @returns {boolean}
   */
  isForageable() {
    return (
      this.forageable === true &&
      this.grantsItemId !== null &&
      this.active === true
    );
  }

  /**
   * Plain-object snapshot suitable for save state or debug overlays.
   * Excludes runtime handles (zone, sprite).
   *
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      speciesId: this.speciesId,
      type: this.type,
      sceneKey: this.sceneKey,
      x: this.x,
      y: this.y,
      spawnedBy: this.spawnedBy,
      interactionRadius: this.interactionRadius,
      observable: this.observable,
      forageable: this.forageable,
      grantsItemId: this.grantsItemId,
      questObservationId: this.questObservationId,
      inspectText: this.inspectText,
      timeOfDayRule: this.timeOfDayRule,
      biomeRule: this.biomeRule,
      eats: [...this.eats],
      eatenBy: [...this.eatenBy],
      nearbyAttractors: [...this.nearbyAttractors],
      relationTags: [...this.relationTags],
      active: this.active,
    };
  }
}

export default EcologyEntity;
