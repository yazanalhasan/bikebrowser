/**
 * The last of the round-4 polish list.
 *
 *   #8  The HUD quest card sat over the workbench's own caption and prompt,
 *       and over both lab doors, in the garage.
 *   #10 A map node's difficulty stars printed through the second line of a
 *       name that wrapped ("Abandoned Copper Mine"), and "← Back to
 *       Neighborhood" was both clipped at the left edge and underneath the
 *       on-screen arrow pad.
 *   #11 A wrong answer in the mine was never marked wrong: `resolveChallenge`
 *       had no callers anywhere, so the answer fell through to the main
 *       quest's advance and the child got "Grab a steel bracket…".
 *   #12 Nobody in this world is called "System", and the weighing quiz
 *       opened with "You weighed each sample. (no measurements yet)".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { challengeDialogAction } from '../src/renderer/game/systems/subSceneDialog.js';
import { NARRATOR, speakerFor } from '../src/renderer/game/systems/questDialog.js';
import QUESTS from '../src/renderer/game/data/quests.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const SRC = [
  'src/renderer/game/scenes/LocalSceneBase.js',
  'src/renderer/game/scenes/NeighborhoodScene.js',
  'src/renderer/game/scenes/WorldMapScene.js',
  'src/renderer/game/scenes/BaseSubScene.js',
  'src/renderer/game/systems/obstacleSystem.js',
  'src/renderer/game/systems/sceneTransition.js',
];

// ── #11: a challenge answer is graded ──────────────────────────────────────

test('answering a challenge asks the scene to grade it', () => {
  const dialog = {
    speaker: NARRATOR,
    choices: [{ label: '2 kg', correct: false }, { label: '4 kg', correct: true }],
    step: { type: 'embedded_challenge', challengeId: 'challenge_CopperMineScene_0' },
  };
  assert.deepEqual(challengeDialogAction(dialog, 0),
    { challengeId: 'challenge_CopperMineScene_0', choiceIndex: 0 });
  assert.deepEqual(challengeDialogAction(dialog, 1),
    { challengeId: 'challenge_CopperMineScene_0', choiceIndex: 1 });
});

test('closing a challenge without answering grades nothing', () => {
  const dialog = { step: { type: 'embedded_challenge', challengeId: 'c1' } };
  assert.equal(challengeDialogAction(dialog, undefined), null);
});

test('other dialogs are left to the quest systems', () => {
  assert.equal(challengeDialogAction({ step: { type: 'quiz' } }, 0), null);
  assert.equal(challengeDialogAction({ step: { isSideQuest: true, questId: 'x' } }, 0), null);
  assert.equal(challengeDialogAction(null, 0), null);
});

test('the scene actually calls it', () => {
  // resolveChallenge existed and was never reached; that is the whole bug.
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.match(base, /this\.resolveChallenge\(challenge\.challengeId, challenge\.choiceIndex\)/);
});

// ── #12: nobody is called "System" ─────────────────────────────────────────

test('no dialog speaks as "System"', () => {
  for (const path of SRC) {
    assert.doesNotMatch(read(path), /speaker: 'System'/,
      `${path} still has a dialog spoken by "System"`);
  }
});

test('a challenge is posed by the notebook, not by "Challenge"', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.doesNotMatch(base, /speaker: 'Challenge'/);
  assert.equal(NARRATOR, "Zuzu's notebook");
});

// ── #12: the weighing quiz has something to weigh ──────────────────────────

test('the child weighs the samples before being quizzed on their weight', () => {
  const steps = QUESTS.bridge_collapse.steps;
  const weigh = steps.findIndex((s) => s.id === 'weigh_samples');
  const quiz = steps.findIndex((s) => s.id === 'quiz_weight');
  assert.ok(weigh >= 0, 'there is no step that weighs anything');
  assert.ok(weigh < quiz, 'the quiz comes before the weighing');
  assert.equal(steps[weigh].requiredObservation, 'masses_measured');
  assert.equal(steps[weigh].scene, 'MaterialLabScene');
});

test('the weighing step mirrors the strength step that already worked', () => {
  const steps = QUESTS.bridge_collapse.steps;
  const weigh = steps.find((s) => s.id === 'weigh_samples');
  const strength = steps.find((s) => s.id === 'test_material');
  assert.equal(weigh.type, strength.type);
  assert.ok(weigh.hint, 'a blocked step needs to say what to do');
});

// ── #10: the map ───────────────────────────────────────────────────────────

test('map stars sit under whatever the name came to', () => {
  const map = read('src/renderer/game/scenes/WorldMapScene.js');
  assert.doesNotMatch(map, /text\(x, y \+ 48, stars/, 'the fixed star offset is back');
  assert.doesNotMatch(map, /text\(0, 48, stars/, 'the fixed star offset is back');
  const stacked = map.match(/nameLabel\.y \+ nameLabel\.height/g) || [];
  assert.equal(stacked.length, 2, 'both node renderers must stack the stars');
});

test('the way off the map is readable and out from under the arrow pad', () => {
  const map = read('src/renderer/game/scenes/WorldMapScene.js');
  assert.match(map, /text\(190, height - 35, '← Back to Neighborhood'/);
  assert.match(map, /'← Back to Neighborhood'[\s\S]{0,220}setOrigin\(0, 0\.5\)/,
    'left-anchored, or the first word runs off the screen');
});

// ── #8: the HUD gets out of the way at a prop ──────────────────────────────

test('the quest column fades while Zuzu is at something he can use', () => {
  const container = read('src/renderer/game/GameContainer.jsx');
  assert.match(container, /registry\.get\('propPromptVisible'\)/);
  assert.match(container, /atProp \? 'opacity-0' : 'opacity-100'/);
  const base = read('src/renderer/game/scenes/LocalSceneBase.js');
  assert.match(base, /registry\.set\('propPromptVisible', anyPrompting\)/,
    'the scene must publish it for the HUD to read');
});

// ── banded captions obey the self-naming rule ──────────────────────────────

test('a caption that names the NPC is read by the notebook', () => {
  // The quest-completion caption is written as narration: "The tire is
  // fixed! Mrs. Ramirez is so happy." Spoken BY her it reads as someone
  // talking about herself. `_emitEnrichedDialog` used to assign the NPC
  // directly and skip the rule that already existed for this.
  const line = 'The tire is fixed! Mrs. Ramirez is so happy.';
  assert.equal(speakerFor({ type: 'dialogue' }, line, 'Mrs. Ramirez', true), NARRATOR);
});

test('a line in her own voice is still hers', () => {
  const line = '"Thank you so much, Zuzu! You\'re a real bike mechanic!"';
  assert.equal(speakerFor({ type: 'dialogue' }, line, 'Mrs. Ramirez', true), 'Mrs. Ramirez');
});

test('the scene routes every caption through the rule', () => {
  const scene = read('src/renderer/game/scenes/NeighborhoodScene.js');
  assert.match(scene, /speakerFor\(step, text, npcName, true\)/);
  const direct = scene.match(/speaker,\n\s+text: (?:immediateText|enrichedText)/g) || [];
  assert.equal(direct.length, 0, 'a caption still assigns the speaker directly');
});
