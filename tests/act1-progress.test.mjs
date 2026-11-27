import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAct1, stampAct1 } from '../src/renderer/game/systems/act1Progress.js';
import { isLocationUnlocked } from '../src/renderer/game/data/worldMapData.js';
import { getVocabItem } from '../src/renderer/game/data/languages.js';
import { COMPANIONS, pickCompanionLine } from '../src/renderer/game/data/companions.js';
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

test('language practice serves the Modern Standard Arabic cards', () => {
  const result = practiceLanguageTerm({}, 'ar_fix');
  assert.equal(result.ok, true);
  // Script, transliteration and English caption all reach the player, and
  // the placeholder wording is gone.
  assert.match(result.message, /إصلاح/); // islaah
  assert.match(result.message, /islaah/);
  assert.match(result.message, /repair \/ fix/);
  assert.doesNotMatch(result.message, /needs a human language brief/);
  assert.equal(result.state.languagePractice.ar_fix.languageSlot, 'ar');
  assert.equal(result.state.languagePractice.ar_fix.practiced, 1);
});

test('the Act 1 cards are MSA, not the withdrawn colloquial fills', () => {
  // Owner decision 2026-11-26: Act 1 teaches Modern Standard Arabic. The
  // colloquial forms must not reappear anywhere on a card.
  const msa = {
    ar_hello: { script: 'مرحبا', transliteration: 'marhaba' },
    ar_water: { script: 'ماء', transliteration: "maa'" },
    ar_fix: { script: 'إصلاح', transliteration: 'islaah' },
  };
  for (const card of LANGUAGE_CARDS) {
    assert.equal(card.script, msa[card.id].script, `${card.id} script`);
    assert.equal(card.transliteration, msa[card.id].transliteration, `${card.id} translit`);
  }
  const allText = JSON.stringify(LANGUAGE_CARDS);
  for (const withdrawn of ['mar7aba', 'mayy', 'salli7', 'Biddak', 'ya3ni', 'saykal']) {
    assert.doesNotMatch(allText, new RegExp(withdrawn, 'i'), `${withdrawn} must be gone`);
  }
});

test('every LANGUAGE_CARDS entry matches its data/languages.js row', () => {
  // languages.js is the only source for the words themselves: no card may
  // carry a script, transliteration or gloss that differs from its row.
  assert.ok(LANGUAGE_CARDS.length > 0, 'the deck must not be empty');
  for (const card of LANGUAGE_CARDS) {
    const row = getVocabItem(card.id);
    assert.ok(row, `${card.id} has no row in data/languages.js`);
    assert.equal(card.script, row.script, `${card.id} script must match its row`);
    assert.equal(
      card.transliteration, row.transliteration,
      `${card.id} transliteration must match its row`,
    );
    assert.equal(card.english, row.englishGloss, `${card.id} gloss must match its row`);
    assert.equal(card.languageSlot, row.languageCode, `${card.id} slot must match its row`);
    // Mariam says the word itself plus an English caption — nothing else.
    assert.equal(card.spokenScript, row.script, `${card.id} spoken script is the word`);
    assert.match(
      card.spokenTransliteration, new RegExp(`^${row.transliteration}$`, 'i'),
      `${card.id} spoken transliteration is the word`,
    );
  }
});

test('Lina repeats the card word from languages.js, never a hard-coded one', () => {
  // Her stored lines keep a placeholder, so no word is spelled out in data.
  for (const line of COMPANIONS.lina.lines.filter((l) => l.requiresCard)) {
    assert.match(line.text, /\{term\}/, `${line.id} must use the {term} placeholder`);
  }
  // Resolved lines carry the MSA word and no leftover placeholder.
  const seen = new Set();
  for (let i = 0; i < 6; i += 1) {
    const state = {
      languagePractice: {
        ar_hello: { practiced: 1 },
        ar_water: { practiced: 1 },
        ar_fix: { practiced: 1 + i },
      },
    };
    const line = pickCompanionLine(COMPANIONS.lina, state);
    assert.doesNotMatch(line.text, /\{term\}/, 'placeholder must be filled');
    seen.add(line.id);
  }
  assert.ok(seen.size >= 2, 'she should rotate through the words she has heard');
  // No colloquial fill and no unapproved Spanish anywhere in her lines.
  const allText = JSON.stringify(COMPANIONS.lina.lines);
  for (const withdrawn of ['mar7aba', 'mayy', 'salli7', 'Vamos']) {
    assert.doesNotMatch(allText, new RegExp(withdrawn, 'i'), `${withdrawn} must be gone`);
  }
});

test('Lina greets in English - the Spanish brief is not approved', () => {
  const greet = pickCompanionLine(COMPANIONS.lina, {});
  assert.equal(greet.id, 'lina_greet');
  assert.doesNotMatch(greet.text, /[¡¿]/, 'no Spanish punctuation');
  assert.doesNotMatch(greet.text, /Vamos/i);
  assert.doesNotMatch(greet.text, /[؀-ۿ]/, 'the plain greeting carries no Arabic');
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

test('the scope limit holds: exactly three cards, no Spanish track', () => {
  // Act 1 teaches only hello / water / repair. The wider 21-term starter
  // deck, and any Spanish cards, need a further owner sign-off.
  assert.equal(LANGUAGE_CARDS.length, 3);
  assert.equal(LANGUAGE_CARDS.some((c) => c.languageSlot === 'es'), false);
});

test('practice saved under the old placeholder ids still resolves', () => {
  const result = practiceLanguageTerm({}, 'placeholder_repair');
  assert.equal(result.ok, true);
  assert.equal(result.card.id, 'ar_fix');
});

test('Mariam says the MSA word with its English caption', () => {
  const line = getMentorLine('ar_water');
  assert.equal(line.script, 'ماء'); // maa'
  assert.match(line.transliteration, /^Maa'$/);
  assert.match(line.caption, /water/);
  assert.doesNotMatch(line.transliteration, /Biddak|mayy/i);
  assert.equal(line.languageSlot, 'ar');
});

test('crafting still combines real ingredients', () => {
  const result = craft('healing_salve', ['creosote_leaves', 'agave_fiber']);
  assert.equal(result.success, true);
  assert.ok(result.inventory.includes('healing_salve'));
});
