import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GODOT_SAVE_KEY,
  buildGodotMessage,
  isAllowedGodotEventType,
  validateGodotBridgeEvent,
} from '../src/renderer/godot/bridgeEvents.js';

test('accepts quest_started events with a quest id and timestamp', () => {
  const event = validateGodotBridgeEvent({
    type: 'quest_started',
    questId: 'chain_repair',
    timestamp: '2026-05-12T00:00:00.000Z',
  });

  assert.equal(event.ok, true);
  assert.equal(event.event.type, 'quest_started');
  assert.equal(event.event.questId, 'chain_repair');
});

test('accepts reward_intent events with amount, label, and idempotency key', () => {
  const event = validateGodotBridgeEvent({
    type: 'reward_intent',
    questId: 'chain_repair',
    amount: 1,
    currency: 'allowance_usd',
    label: 'Chain repair mission',
    idempotencyKey: 'godot:chain_repair:inspect_chain:v1',
    timestamp: '2026-05-12T00:00:00.000Z',
  });

  assert.equal(event.ok, true);
  assert.equal(event.event.type, 'reward_intent');
  assert.equal(event.event.amount, 1);
});

test('rejects malformed Godot bridge events', () => {
  assert.equal(validateGodotBridgeEvent(null).ok, false);
  assert.equal(validateGodotBridgeEvent({ type: 'quest_started' }).ok, false);
  assert.equal(validateGodotBridgeEvent({ type: 'reward_intent', amount: -1 }).ok, false);
  assert.equal(validateGodotBridgeEvent({ type: 'unknown_event' }).ok, false);
});

test('builds React-to-Godot messages without using the Phaser save key', () => {
  const message = buildGodotMessage('hydrate_save', {
    saveKey: GODOT_SAVE_KEY,
    save: { player: { regionId: 'neighborhood_street' } },
  });

  assert.equal(message.type, 'hydrate_save');
  assert.equal(message.saveKey, 'bikebrowser_godot_test_save');
  assert.equal(JSON.stringify(message).includes('bikebrowser_game_save'), false);
});

test('documents allowed event type boundary', () => {
  assert.equal(isAllowedGodotEventType('quest_started'), true);
  assert.equal(isAllowedGodotEventType('reward_intent'), true);
  assert.equal(isAllowedGodotEventType('save_requested'), true);
  assert.equal(isAllowedGodotEventType('debug_log'), true);
  assert.equal(isAllowedGodotEventType('adult_purchase'), false);
});
