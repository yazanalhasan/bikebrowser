#!/usr/bin/env node

/**
 * Cognitive quest generator scaffold.
 *
 * This intentionally does not call an AI service directly. It gives Claude or
 * another authoring tool a strict JSON target so generated quests stay
 * compatible with the CognitiveEngine schema.
 *
 * Usage:
 *   node tools/generateCognitiveQuest.js arizona StreetBlockScene 2
 */

const [biome = 'arizona', scene = 'StreetBlockScene', level = '1'] = process.argv.slice(2);

const slug = `${biome}_${scene}_${level}`
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const quest = {
  id: `${slug}_reasoning`,
  title: 'Generated Cognitive Quest',
  biome,
  type: 'pattern',
  difficulty: Math.max(1, Math.min(5, Number(level) || 1)),
  prompt: 'What can the player infer from the visible world state?',
  trigger: { scene },
  mechanic: 'Replace this with a visual-first interaction using objects already in the scene.',
  mensaLayer: 'Describe the hidden reasoning skill: pattern, deduction, spatial, optimization, or sequence.',
  rewards: { xp: 6, currency: 5 },
  evaluation: { correctOptionId: 'correct_option' },
  options: [
    { id: 'correct_option', label: 'Correct visual inference', correct: true },
    { id: 'near_miss', label: 'Plausible but incomplete', correct: false },
    { id: 'distractor', label: 'Visible but non-causal clue', correct: false },
  ],
  feedback: {
    correct: 'Correct. The visual evidence supports that conclusion.',
    incorrect: 'Look for the clue that changes the outcome.',
    hint: 'Focus on cause and effect, not the most obvious object.',
  },
};

process.stdout.write(`${JSON.stringify(quest, null, 2)}\n`);
