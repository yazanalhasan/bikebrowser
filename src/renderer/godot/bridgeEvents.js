export const GODOT_SAVE_KEY = 'bikebrowser_godot_test_save';
export const PHASER_SAVE_KEY = 'bikebrowser_game_save';

export const GODOT_TO_REACT_EVENTS = new Set([
  'quest_started',
  'reward_intent',
  'save_requested',
  'debug_log',
]);

export const REACT_TO_GODOT_EVENTS = new Set([
  'hydrate_save',
  'settings_update',
  'reward_balance',
]);

export function isAllowedGodotEventType(type) {
  return GODOT_TO_REACT_EVENTS.has(type);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoishTimestamp(value) {
  return typeof value === 'string' && value.length >= 10;
}

function fail(reason) {
  return { ok: false, reason };
}

function ok(event) {
  return { ok: true, event };
}

export function validateGodotBridgeEvent(raw) {
  if (!isPlainObject(raw)) return fail('event must be an object');
  if (!isAllowedGodotEventType(raw.type)) return fail('unsupported event type');
  if (!isIsoishTimestamp(raw.timestamp)) return fail('timestamp is required');

  if (raw.type === 'quest_started') {
    if (typeof raw.questId !== 'string' || raw.questId.length === 0) {
      return fail('quest_started requires questId');
    }
  }

  if (raw.type === 'reward_intent') {
    if (typeof raw.questId !== 'string' || raw.questId.length === 0) {
      return fail('reward_intent requires questId');
    }
    if (typeof raw.amount !== 'number' || raw.amount <= 0) {
      return fail('reward_intent requires positive amount');
    }
    if (typeof raw.label !== 'string' || raw.label.length === 0) {
      return fail('reward_intent requires label');
    }
    if (typeof raw.idempotencyKey !== 'string' || raw.idempotencyKey.length === 0) {
      return fail('reward_intent requires idempotencyKey');
    }
  }

  if (raw.type === 'save_requested' && raw.saveKey && raw.saveKey !== GODOT_SAVE_KEY) {
    return fail('save_requested may only use the Godot test save key');
  }

  return ok({ ...raw });
}

export function buildGodotMessage(type, payload = {}) {
  if (!REACT_TO_GODOT_EVENTS.has(type)) {
    throw new Error(`Unsupported React to Godot event: ${type}`);
  }
  const message = {
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (JSON.stringify(message).includes(PHASER_SAVE_KEY)) {
    throw new Error('Godot bridge messages must not reference the Phaser save key');
  }

  return message;
}
