import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAct1, stampAct1 } from '../src/renderer/game/systems/act1Progress.js';
import { isLocationUnlocked } from '../src/renderer/game/data/worldMapData.js';
import { hasKnowledge, markKnowledge } from '../src/renderer/game/systems/knowledgeState/index.js';
import { practiceLanguageTerm } from '../src/renderer/game/systems/languageLayer.js';
import { craft } from '../src/renderer/game/systems/craftingSystem.js';

function doneState() {
  return {
    completedQuests: [
      'flat_tire_repair',
      'chain_repair',
      'bridge_collapse',
      'food_chain_tracker',
      'medicine_balance',
    ],
    reputation: 40,
    materialLog: [],
    journal: [],
  };
}

test('Act 1 stays closed until bike, bridge, ecology, and dose-response are done', () => {
  const partial = evaluateAct1({
    completedQuests: ['flat_tire_repair'],
    reputation: 10,
    journal: [],
  });
  assert.equal(partial.complete, false);
  assert.equal(partial.rows.find((row) => row.id === 'bike').done, false);
  assert.equal(isLocationUnlocked('wider_earth_gate', {
    completedQuests: ['flat_tire_repair'],
    reputation: 10,
  }), false);
});

test('Act 1 opens the wider-map gate and stamps regional travel once', () => {
  const report = evaluateAct1(doneState());
  assert.equal(report.complete, true);
  assert.equal(report.systemsUpgrade, 'regional_travel');
  assert.equal(isLocationUnlocked('wider_earth_gate', doneState()), true);

  const stamped = stampAct1(doneState());
  assert.equal(stamped.act1.complete, true);
  assert.equal(stamped.act1.systemsUpgrade, 'regional_travel');
  const again = stampAct1(stamped);
  assert.equal(again.journal.filter((line) => line.includes('Wider map')).length, 1);
});

test('knowledge state layers on without forgetting or unbriefed cultural entries', () => {
  let state = {};
  state = markKnowledge(state, 'concept:friction', 'seen', 'lesson');
  state = markKnowledge(state, 'concept:friction', 'understood', 'lesson');
  state = markKnowledge(state, 'concept:friction', 'seen', 'again');
  assert.equal(hasKnowledge(state, 'concept:friction', 'understood'), true);
  assert.throws(() => markKnowledge(state, 'cultural:unbriefed', 'seen', 'agent'));
  state = markKnowledge(state, 'cultural:briefed', 'seen', 'human', { requiresDesignBrief: true });
  assert.equal(hasKnowledge(state, 'cultural:briefed', 'seen'), true);
});

test('language practice uses placeholders and does not invent a translation', () => {
  const result = practiceLanguageTerm({}, 'placeholder_repair');
  assert.equal(result.ok, true);
  assert.match(result.message, /needs a human language brief/);
  assert.equal(result.state.languagePractice.placeholder_repair.practiced, 1);
  assert.doesNotMatch(result.message, /[\u0600-\u06FF]/);
});

test('crafting still combines real ingredients', () => {
  const result = craft('healing_salve', ['creosote_leaves', 'agave_fiber']);
  assert.equal(result.success, true);
  assert.ok(result.inventory.includes('healing_salve'));
});
