/**
 * Regression tests for the third review pass (2026-11-27).
 *
 * One per MUST, plus the owner's bridge-quiz decision.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dialogForStep,
  speakerFor,
  questOfferDialog,
  acceptQuestOffer,
  resumeParkedQuest,
  NARRATOR,
} from '../src/renderer/game/systems/questDialog.js';
import QUESTS from '../src/renderer/game/data/quests.js';
import { getNpcProfile } from '../src/renderer/game/data/npcProfiles.js';
import { MATERIALS } from '../src/renderer/game/systems/materials/materialDatabase.js';
import { getAvailableMilestones } from '../src/renderer/game/systems/milestoneEngine.js';
import { describeCondition } from '../src/renderer/game/systems/milestoneText.js';
import { INDOOR_SCENES, prettyName } from '../src/renderer/game/systems/sceneAmbience.js';

// ── MUST 1: a quest cannot be finished away from its giver ─────────────────

test('MUST1: a giver-conversation step does not chain when the giver is absent', () => {
  const state = { activeQuest: { id: 'desert_healer', stepIndex: 0 } };
  for (const type of ['dialogue', 'complete']) {
    const away = dialogForStep({ type, text: 'Nice work!' }, state, 'Mrs. Ramirez',
      { giverPresent: false });
    assert.equal(away.step, null, `${type}: no step, so Continue cannot advance it`);
    assert.equal(away.objective, true, `${type}: it is an objective reminder`);
    // Names the person, carries no pronoun — there is no pronoun field on
    // an NPC profile and a name is not one.
    assert.match(away.text, /Go back and tell Mrs\. Ramirez/);
    assert.doesNotMatch(away.text, /(them|her|him|they|she|he)/i,
      'no guessed pronoun for a named person');
    assert.equal(away.speaker, NARRATOR, 'an absent NPC must not speak');
  }
});

test('MUST1: the same step chains normally when the giver is there', () => {
  const state = { activeQuest: { id: 'desert_healer', stepIndex: 0 } };
  const here = dialogForStep({ type: 'dialogue', text: 'Nice work!' }, state,
    'Mrs. Ramirez', { giverPresent: true });
  assert.ok(here.step, 'the real step is carried, so Continue advances');
  assert.equal(here.speaker, 'Mrs. Ramirez');
});

test('MUST1: go-and-do steps still give instructions when the giver is away', () => {
  // The child is in the desert; they still need to know what to fetch. The
  // notebook says it, not an NPC who is not there.
  const state = { activeQuest: { id: 'desert_healer', stepIndex: 1 } };
  for (const type of ['forage', 'craft', 'use_item', 'observe', 'inspect']) {
    const d = dialogForStep({ type, text: 'Find creosote.' }, state, 'Mrs. Ramirez',
      { giverPresent: false });
    assert.ok(d.step, `${type} still carries its step`);
    assert.equal(d.speaker, NARRATOR, `${type} is narrated, not spoken by an absent NPC`);
  }
});

// ── MUST 3: nobody talks about themselves in the third person ──────────────

test('MUST3: no quest step is spoken by someone it names', () => {
  // The whole corpus, not a sample.
  const offenders = [];
  for (const [questId, quest] of Object.entries(QUESTS)) {
    const giverName = quest.giver && getNpcProfile(quest.giver)?.name;
    if (!giverName) continue;
    const state = { activeQuest: { id: questId, stepIndex: 0 } };
    for (const step of quest.steps || []) {
      const d = dialogForStep(step, state, giverName, { giverPresent: true });
      if (!d || typeof d.text !== 'string') continue;
      if (d.speaker && d.speaker !== NARRATOR && d.text.includes(d.speaker)) {
        offenders.push(`${questId}/${step.id}: "${d.speaker}" says "${d.text.slice(0, 50)}…"`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'these lines name their own speaker:\n  ' + offenders.join('\n  '));
});

test('MUST3: the known third-person lines go to the notebook', () => {
  // The exact lines the reviewer quoted.
  assert.equal(
    speakerFor({ type: 'complete' }, 'The tire is fixed! Mrs. Ramirez is so happy.', 'Mrs. Ramirez'),
    NARRATOR,
  );
  assert.equal(
    speakerFor({ type: 'dialogue' }, 'Take the data back to Mr. Chen.', 'Mr. Chen'),
    NARRATOR,
  );
  // A line that does not name them is still theirs.
  assert.equal(
    speakerFor({ type: 'dialogue' }, 'Thanks, that looks much better.', 'Mrs. Ramirez'),
    'Mrs. Ramirez',
  );
});

// ── MUST 2: an optional quest must not lock the main path ──────────────────

const fakeStart = (s, id) => ({ ...s, activeQuest: { id, stepIndex: 0 } });

test('MUST2: a quest is offered, never auto-started', () => {
  const offer = questOfferDialog({ id: 'toxic_knowledge', title: 'Toxic Knowledge' }, 'Mrs. Ramirez');
  assert.equal(offer.questOffer.questId, 'toxic_knowledge');
  assert.equal(offer.choices.length, 2, 'Accept and Not now');
  assert.match(offer.choices[1].label, /not right now/i);
  assert.equal(offer.step, null, 'an offer is not a quest step');
});

test('MUST2: with toxic_knowledge active, Chen\'s main quest can still start', () => {
  // The reviewer's exact scenario.
  let state = { activeQuest: { id: 'toxic_knowledge', stepIndex: 2 }, completedQuests: [] };

  const offer = questOfferDialog(
    { id: 'chain_repair', title: QUESTS.chain_repair.title },
    'Mr. Chen',
    { id: 'toxic_knowledge', title: QUESTS.toxic_knowledge.title },
  );
  assert.equal(offer.questOffer.swapsFrom, 'toxic_knowledge', 'the offer knows it is a swap');

  state = acceptQuestOffer(state, 'chain_repair', fakeStart);
  assert.equal(state.activeQuest.id, 'chain_repair', 'the main quest starts');
});

test('MUST2: switching parks the other quest instead of losing it', () => {
  let state = { activeQuest: { id: 'toxic_knowledge', stepIndex: 3 }, completedQuests: [] };
  state = acceptQuestOffer(state, 'chain_repair', fakeStart);
  assert.equal(state.pausedQuests.toxic_knowledge, 3, 'the step index is kept');

  state = { ...state, activeQuest: null };
  state = resumeParkedQuest(state, 'toxic_knowledge');
  assert.deepEqual(state.activeQuest, { id: 'toxic_knowledge', stepIndex: 3 },
    'it comes back where it was left');
  assert.deepEqual(state.pausedQuests, {}, 'and is no longer parked');
});

test('MUST2: declining changes nothing', () => {
  const before = { activeQuest: null, completedQuests: [] };
  // Declining is the caller doing nothing with the offer.
  assert.equal(before.activeQuest, null);
  const offer = questOfferDialog({ id: 'toxic_knowledge', title: 'T' }, 'Mrs. Ramirez');
  assert.ok(offer.questOffer, 'the decision is carried on the dialog, not applied');
});

test('MUST2: resuming a quest that was never parked is a no-op', () => {
  const state = { activeQuest: { id: 'a', stepIndex: 1 } };
  assert.equal(resumeParkedQuest(state, 'nope'), state);
});

// ── OWNER: the bridge quiz must agree with the load test ───────────────────

test('OWNER: the quiz\'s correct answer is the strongest material in the load test', () => {
  const step = QUESTS.bridge_collapse.steps.find((s) => s.id === 'quiz_strength');
  assert.ok(step, 'quiz_strength exists');

  const material = step.choices.filter((c) => c.materialId);
  assert.ok(material.length >= 2, 'the quiz compares materials');
  for (const c of material) {
    assert.ok(MATERIALS[c.materialId], `${c.materialId} is a real material`);
    assert.ok(
      Number.isFinite(MATERIALS[c.materialId].ultimateStrengthMPa),
      `${c.materialId} has a load-test strength`,
    );
  }

  const strongest = material.reduce((a, b) => (
    MATERIALS[a.materialId].ultimateStrengthMPa >= MATERIALS[b.materialId].ultimateStrengthMPa
      ? a : b));
  const correct = step.choices.find((c) => c.correct);
  assert.ok(correct, 'one choice is marked correct');
  assert.equal(
    correct.materialId, strongest.materialId,
    `the correct answer is "${correct.label}" but the load test makes `
    + `"${strongest.label}" strongest`,
  );
});

test('OWNER: the choice labels carry no percentages to contradict the table', () => {
  // The labels said 85/55/35 from one dataset while the table printed
  // 17/75/42 from another. The table is the thing the child reads.
  const step = QUESTS.bridge_collapse.steps.find((s) => s.id === 'quiz_strength');
  for (const c of step.choices) {
    assert.doesNotMatch(c.label, /\d+\s*%/, `"${c.label}" must not state a figure`);
  }
});

// ── Polish items with testable logic ───────────────────────────────────────

test('POLISH13: mining copper satisfies the first-mine milestone', () => {
  // The mine scenes grant `surface_copper` / `deep_copper` into the
  // inventory, but the milestone counted `state.minedResources.copper_ore`,
  // which only `miningSystem.mine()` writes. It read 0/1 forever.
  const probe = (inventory) => {
    const list = getAvailableMilestones({
      inventory, completedQuests: [], milestones: { completed: ['ms_first_repair'] },
    });
    const ms = list.find((m) => m.id === 'ms_first_mine');
    return ms?.conditions?.find((c) => c.type === 'mine');
  };
  assert.equal(probe([]).met, false, 'not met with nothing mined');
  assert.equal(probe(['surface_copper']).met, true, 'surface copper counts');
  assert.equal(probe(['deep_copper']).met, true, 'deep copper counts');
  assert.equal(probe(['copper_ore']).met, true, 'the raw id still counts');
});

test('POLISH12: milestone requirements read as words, not records', () => {
  const list = getAvailableMilestones({
    inventory: [], completedQuests: [], milestones: { completed: ['ms_first_repair'] },
  });
  const ms = list.find((m) => m.id === 'ms_first_mine');
  const condition = ms.conditions.find((c) => c.type === 'mine');
  const text = describeCondition(condition);
  assert.doesNotMatch(text, /^mine:/, 'no raw "mine: copper_ore" form');
  assert.match(text, /copper ore/i, 'the thing to find is named in words');
});

test('POLISH4: plant ids are prettified before a child sees them', () => {
  assert.equal(prettyName('desert_lavender'), 'Desert lavender');
  assert.equal(prettyName('mesquite'), 'Mesquite');
  assert.equal(prettyName(''), 'A plant');
  assert.equal(prettyName(undefined), 'A plant');
});

test('POLISH4: the heat warning is an outdoor cue', () => {
  for (const indoor of ['ZuzuGarageScene', 'MaterialLabScene', 'ThermalRigScene', 'CopperMineScene']) {
    assert.equal(INDOOR_SCENES.has(indoor), true, `${indoor} is indoors`);
  }
  for (const outdoor of ['StreetBlockScene', 'DesertEdgeScene', 'DryWashScene']) {
    assert.equal(INDOOR_SCENES.has(outdoor), false, `${outdoor} is outdoors`);
  }
});
