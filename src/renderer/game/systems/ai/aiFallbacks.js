/**
 * AI Fallbacks — deterministic templates for when AI providers are unavailable.
 *
 * Every AI request type has a fallback that works offline, instantly,
 * and never breaks gameplay. These use real game state data — they're
 * grounded analysis, not random text.
 */

import { rankRootCauses, generateRecommendations, classifyFailureState } from '../../utils/failureMath.js';
import { MATERIAL_MAP } from '../../data/materials.js';
import { FLORA_MAP } from '../../data/flora.js';
import { getLocalTerm } from '../../data/languages.js';

// ── Failure Analysis Fallback ────────────────────────────────────────────────

export function fallbackFailureAnalysis(payload) {
  const state = payload.state || {};
  const causes = rankRootCauses(state, payload.materialContext);
  const recs = generateRecommendations(state, causes, payload.materialContext);
  const fs = classifyFailureState(state);
  const top = causes[0];

  // Build precise summary from actual metrics
  const metrics = [];
  if (state.stress > 0.5) metrics.push(`stress at ${Math.round(state.stress * 100)}%`);
  if (state.fatigue > 0.3) metrics.push(`fatigue at ${Math.round(state.fatigue * 100)}%`);
  if (state.temperature > 0.5) metrics.push(`temperature at ${Math.round(state.temperature * 100)}%`);
  if (state.bondStress > 0.4) metrics.push(`bond stress at ${Math.round(state.bondStress * 100)}%`);

  const mat = payload.material ? MATERIAL_MAP[payload.material] : null;
  const matNote = mat ? ` ${mat.label} (strength: ${Math.round(mat.structural.strength * 100)}%)` : '';

  const summary = top
    ? `${payload.component || 'Component'}${matNote} failed: ${top.label.toLowerCase()}. ${metrics.length > 0 ? 'Readings: ' + metrics.join(', ') + '.' : ''}`
    : `${fs.label} detected.${metrics.length > 0 ? ' ' + metrics.join(', ') + '.' : ''}`;

  return {
    summary,
    cause: top?.fix || top?.label || 'Unknown',
    contributingFactors: causes.slice(1, 4).map((c) => c.label),
    recommendedFixes: recs.slice(0, 3).map((r) => r.action),
    tradeoffs: recs.slice(0, 2).map((r) => r.reason),
    urgency: fs.severity > 0.7 ? 'high' : fs.severity > 0.4 ? 'medium' : 'low',
    confidence: 0.7,
    source: 'fallback',
  };
}

// ── Gameplay Hint Fallback ───────────────────────────────────────────────────

export function fallbackGameplayHint(payload) {
  const p = payload.player || {};
  const env = payload.environment || {};

  if (p.toxicity > 0.6) {
    return { hint: 'Toxicity is dangerous. Stop consuming toxic plants. It decays slowly.', reason: 'High toxicity damages health over time.', nextAction: 'Wait and avoid toxic plants.', priority: 'high', source: 'fallback' };
  }
  if (p.hydration < 0.15) {
    return { hint: 'Critical dehydration! Prickly pear fruit restores hydration. Barrel cactus works but causes nausea.', reason: 'Desert heat drains water fast.', nextAction: 'Find prickly pear or water.', priority: 'high', source: 'fallback' };
  }
  if (p.health < 0.2) {
    return { hint: 'Health critical. Craft a healing salve (creosote + agave) or eat mesquite pods.', reason: 'Low health means you cannot survive further damage.', nextAction: 'Heal immediately.', priority: 'high', source: 'fallback' };
  }
  if (env.temperature > 0.7 && p.hydration < 0.4) {
    return { hint: 'Extreme heat + low water is dangerous. Find shade and hydrate.', reason: 'Heat accelerates dehydration.', nextAction: 'Seek shade, then find water.', priority: 'high', source: 'fallback' };
  }
  if (env.fluidType === 'non_newtonian') {
    return { hint: 'Non-Newtonian ground! Sprint across. Slow movement = sinking.', reason: 'Shear-thickening fluid resists fast impact but yields to slow pressure.', nextAction: 'Hold sprint and run straight.', priority: 'medium', source: 'fallback' };
  }
  if (env.contaminationLevel > 0.4) {
    return { hint: 'Contaminated area. Items foraged here need antimicrobial treatment.', reason: 'Bacteria grow faster in moist, warm contaminated soil.', nextAction: 'Use creosote resin to treat foraged items.', priority: 'medium', source: 'fallback' };
  }
  if (p.nearPlant && p.nearestPlantSpecies) {
    const flora = FLORA_MAP[p.nearestPlantSpecies];
    if (flora) {
      const uses = [];
      if (flora.pharmacology?.hydrating > 0.2) uses.push('hydrating');
      if (flora.pharmacology?.antimicrobial > 0.3) uses.push('antimicrobial');
      if (flora.pharmacology?.nutritive > 0.3) uses.push('nutritious');
      if (flora.pharmacology?.toxicity > 0.2) uses.push('⚠️ toxic in high doses');
      return { hint: `${flora.label}: ${uses.join(', ') || 'forageable'}.`, reason: 'Nearby harvestable plant.', nextAction: 'Press action to forage.', priority: 'low', source: 'fallback' };
    }
  }

  return { hint: 'Explore the desert. Plants, animals, and materials are all around you.', reason: 'No immediate threats.', nextAction: 'Keep exploring.', priority: 'low', source: 'fallback' };
}

// ── Language Reinforcement Fallback ──────────────────────────────────────────

export function fallbackLanguageReinforcement(payload) {
  const regionId = payload.regionId;
  const word = payload.recentWord;
  if (!regionId || !word) {
    return { term: '', meaning: '', context: '', practicePhrase: '', source: 'fallback' };
  }
  const vocab = getLocalTerm(regionId, word);
  if (!vocab) {
    return { term: word, meaning: word, context: 'Keep exploring to learn more terms.', practicePhrase: '', source: 'fallback' };
  }
  return {
    term: vocab.script,
    meaning: vocab.englishGloss,
    context: `You encountered "${vocab.script}" (${vocab.transliteration}) — ${vocab.englishGloss}.`,
    practicePhrase: `${vocab.script} (${vocab.transliteration})`,
    source: 'fallback',
  };
}

// ── NPC Dialogue Fallback ────────────────────────────────────────────────────

export function fallbackNPCDialogue(payload) {
  return {
    text: payload.originalText || 'Hello, traveler.',
    tone: 'neutral',
    learningCue: null,
    source: 'fallback',
  };
}

// ── Quiz Question Fallback ───────────────────────────────────────────────────

export { pickFallbackQuestion as fallbackQuizQuestion } from '../education/quizQuestionGenerator.js';

// ── Quest Guidance Fallback ──────────────────────────────────────────────────

export function fallbackQuestGuidance(payload) {
  return {
    goal: payload.questTitle || 'Continue your adventure.',
    whyItMatters: 'Every quest teaches something about the desert ecosystem.',
    nextStep: payload.currentStepText || 'Talk to the quest giver for guidance.',
    source: 'fallback',
  };
}
