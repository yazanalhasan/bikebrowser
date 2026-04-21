/**
 * Gameplay Arbiter — prevents simultaneous system interruptions.
 *
 * Enforces priority layers so only one major system can claim the player's
 * attention at a time. Lower-priority events are suppressed (not queued)
 * while a higher-priority activity is active.
 *
 * Priority order (highest → lowest):
 *   1. Critical gameplay (movement, physics challenges, combat)
 *   2. NPC interaction / dialogue
 *   3. Quests / crafting
 *   4. Educational overlays (physics questions)
 *   5. Ambient systems (hints, alerts)
 *
 * Integration: MCPSystem registers this. GameContainer updates busy flags
 * via Phaser registry events.
 */

// ── Priority Levels ─────────────────────────────────────────────────────────

export const PRIORITY = {
  CRITICAL: 1,     // physics challenge, combat, animation lock
  DIALOGUE: 2,     // NPC interaction, dialogue overlay
  QUEST: 3,        // active quest step, crafting
  EDUCATION: 4,    // physics questions, quiz overlays
  AMBIENT: 5,      // hints, alerts, ambient notifications
};

// ── Busy State Flags ────────────────────────────────────────────────────────

const _busyFlags = {
  inDialogue: false,
  interactingWithNPC: false,
  crafting: false,
  inVehicle: false,
  activeQuestStep: false,
  animationLock: false,
  physicsChallenge: false,
  inMenu: false,
  paused: false,
  inSubScene: false,
};

// ── Question Cooldown ───────────────────────────────────────────────────────

const QUESTION_COOLDOWN_MIN = 60000;  // 60 seconds minimum between questions
const QUESTION_COOLDOWN_MAX = 120000; // 120 seconds maximum
let _lastQuestionDismissedAt = 0;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Set a busy flag. Call when entering a state (dialogue, crafting, etc).
 * @param {string} flag - one of the _busyFlags keys
 * @param {boolean} value
 */
export function setBusy(flag, value) {
  if (flag in _busyFlags) {
    _busyFlags[flag] = !!value;
  }
}

/**
 * Check if the player is busy with any activity.
 * @returns {boolean}
 */
export function isPlayerBusy() {
  return Object.values(_busyFlags).some(Boolean);
}

/**
 * Check if the player is idle (not busy with anything).
 * @returns {boolean}
 */
export function isPlayerIdle() {
  return !isPlayerBusy();
}

/**
 * Get the current highest-priority active layer.
 * Returns the priority level number (lower = higher priority), or Infinity if idle.
 */
export function getActivePriority() {
  if (_busyFlags.physicsChallenge || _busyFlags.animationLock) return PRIORITY.CRITICAL;
  if (_busyFlags.inDialogue || _busyFlags.interactingWithNPC) return PRIORITY.DIALOGUE;
  if (_busyFlags.activeQuestStep || _busyFlags.crafting) return PRIORITY.QUEST;
  if (_busyFlags.inMenu || _busyFlags.paused) return PRIORITY.CRITICAL;
  return Infinity; // idle
}

/**
 * Check if a system at the given priority level is allowed to interrupt.
 * Only allowed if no higher-priority (lower number) system is active.
 * @param {number} priority - the priority level requesting interruption
 * @returns {boolean}
 */
export function canInterrupt(priority) {
  return priority <= getActivePriority();
}

/**
 * Check if an education question is allowed right now.
 * Requirements:
 *   - Player must be idle (no busy flags)
 *   - Cooldown since last question must have elapsed
 *   - Player must NOT be moving (checked externally by caller)
 * @returns {boolean}
 */
export function canShowQuestion() {
  if (isPlayerBusy()) return false;
  const cooldown = QUESTION_COOLDOWN_MIN + Math.random() * (QUESTION_COOLDOWN_MAX - QUESTION_COOLDOWN_MIN);
  if (Date.now() - _lastQuestionDismissedAt < cooldown) return false;
  return true;
}

/**
 * Record that a question was just dismissed (answered or skipped).
 * Resets the cooldown timer.
 */
export function recordQuestionDismissed() {
  _lastQuestionDismissedAt = Date.now();
}

/**
 * Check if a question should be immediately cancelled because the player
 * became active (started moving, entered dialogue, etc).
 * @param {boolean} isMoving - whether the player is currently moving
 * @returns {boolean}
 */
export function shouldDismissQuestion(isMoving) {
  return isMoving || isPlayerBusy();
}

/**
 * Get a snapshot of all busy flags for debugging.
 * @returns {object}
 */
export function getBusySnapshot() {
  return { ..._busyFlags };
}

/**
 * Reset all busy flags (e.g., on scene transition or new game).
 */
export function resetBusyState() {
  for (const key of Object.keys(_busyFlags)) {
    _busyFlags[key] = false;
  }
  _lastQuestionDismissedAt = 0;
}
