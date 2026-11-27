import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAct1, stampAct1 } from '../src/renderer/game/systems/act1Progress.js';
import { isLocationUnlocked } from '../src/renderer/game/data/worldMapData.js';
import { hasKnowledge, markKnowledge } from '../src/renderer/game/systems/knowledgeState/index.js';
import {
  practiceLanguageTerm,
  getMentorLine,
  LANGUAGE_CARDS,
} from '../src/renderer/game/systems/languageLayer.js';
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

test('language practice serves the briefed Levantine Arabic cards', () => {
  const result = practiceLanguageTerm({}, 'ar_fix');
  assert.equal(result.ok, true);
  // Script, kid transliteration and English caption all reach the player,
  // and the placeholder wording is gone.
  assert.match(result.message, /\u0635\u0644\u0651\u062D/);
  assert.match(result.message, /salli7/);
  assert.match(result.message, /fix it so it works again/);
  assert.doesNotMatch(result.message, /needs a human language brief/);
  assert.equal(result.state.languagePractice.ar_fix.languageSlot, 'ar');
  assert.equal(result.state.languagePractice.ar_fix.practiced, 1);
});

test('the three Act 1 cards are Arabic-slotted and name Mariam as mentor', () => {
  assert.deepEqual(LANGUAGE_CARDS.map((c) => c.id), ['ar_hello', 'ar_water', 'ar_fix']);
  for (const card of LANGUAGE_CARDS) {
    assert.equal(card.languageSlot, 'ar');
    assert.equal(card.mentor, 'mariam');
    assert.match(card.script, /[\u0600-\u06FF]/, `${card.id} needs Arabic script`);
    assert.ok(card.transliteration, `${card.id} needs a transliteration`);
    assert.ok(card.caption, `${card.id} needs an English caption`);
  }
});

test('the brief-scope limit holds: exactly three cards, no Spanish track', () => {
  // levantine-arabic.md authorises only hello / water / repair. Its wider
  // 21-term starter deck, and any Spanish cards, need a further sign-off.
  assert.equal(LANGUAGE_CARDS.length, 3);
  assert.equal(LANGUAGE_CARDS.some((c) => c.languageSlot === 'es'), false);
});

test('practice saved under the old placeholder ids still resolves', () => {
  const result = practiceLanguageTerm({}, 'placeholder_repair');
  assert.equal(result.ok, true);
  assert.equal(result.card.id, 'ar_fix');
});

test('Mariam speaks the whole briefed line, not just the bare term', () => {
  const line = getMentorLine('ar_water');
  assert.match(line.script, /\u0645\u064A/);
  assert.match(line.transliteration, /Biddak mayy/);
  assert.equal(line.languageSlot, 'ar');
});

test('crafting still combines real ingredients', () => {
  const result = craft('healing_salve', ['creosote_leaves', 'agave_fiber']);
  assert.equal(result.success, true);
  assert.ok(result.inventory.includes('healing_salve'));
});
