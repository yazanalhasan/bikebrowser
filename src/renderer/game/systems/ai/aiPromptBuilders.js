/**
 * AI Prompt Builders — precise, grounded prompts from real game state.
 *
 * Rules:
 *   - structured input only (no narrative)
 *   - limit to relevant variables
 *   - force causal reasoning
 *   - shorter responses, clearer cause-effect
 *   - always actionable, no fluff
 *   - never ask model to invent missing systems
 */

// ── Failure Analysis ─────────────────────────────────────────────────────────

export function buildFailurePrompt(data) {
  // Compute derived metrics for the model
  const stressPercent = data.stress != null ? Math.round(data.stress * 100) : null;
  const fatiguePercent = data.fatigue != null ? Math.round(data.fatigue * 100) : null;
  const tempPercent = data.temperature != null ? Math.round(data.temperature * 100) : null;
  const loadPercent = data.load != null ? Math.round(data.load * 100) : null;

  return `You are a systems engineer analyzing a mechanical failure. Be precise. No speculation beyond the data provided.

FAILURE DATA:
- component: ${data.component || 'unspecified'}
- material: ${data.material || 'unspecified'}
- stress: ${stressPercent != null ? stressPercent + '% of rated strength' : 'unknown'}
- fatigue: ${fatiguePercent != null ? fatiguePercent + '% accumulated damage' : 'unknown'}
- temperature: ${tempPercent != null ? tempPercent + '% of thermal limit' : 'unknown'}
- applied load: ${loadPercent != null ? loadPercent + '% capacity' : 'unknown'}
- environment: ${data.environment || 'desert, ambient'}
- player action at failure: ${data.playerAction || 'normal operation'}
${data.cause ? `- pre-identified cause category: ${data.cause}` : ''}
${data.bondStress ? `- bond stress at joints: ${Math.round(data.bondStress * 100)}%` : ''}
${data.coatingCoverage != null ? `- protective coating: ${Math.round(data.coatingCoverage * 100)}% coverage` : ''}

TASK:
1. Identify the immediate cause (what physical process caused failure)
2. List contributing factors (what made it worse)
3. Recommend the most effective fix (specific, actionable)
4. State the tradeoff of that fix (what it costs)

Return ONLY valid JSON. No markdown. No narrative.
{"summary":"1 sentence: what failed and the physical reason","cause":"the immediate mechanical cause","contributingFactors":["factor1","factor2"],"recommendedFixes":["most effective fix first","second option"],"tradeoffs":["cost or downside of the primary fix"],"confidence":0.8}

DO NOT speculate beyond the data above.
DO NOT invent systems not mentioned.
DO NOT add story or flavor text.`;
}

// ── Gameplay Hint ────────────────────────────────────────────────────────────

export function buildHintPrompt(data) {
  const p = data.player || data;
  const health = p.health != null ? Math.round(p.health * 100) : null;
  const hydration = p.hydration != null ? Math.round(p.hydration * 100) : null;
  const toxicity = p.toxicity != null ? Math.round(p.toxicity * 100) : null;
  const env = data.environment || {};

  return `You are a desert survival advisor. Give one specific, actionable instruction. No fluff.

PLAYER STATE:
- health: ${health != null ? health + '%' : 'unknown'}
- hydration: ${hydration != null ? hydration + '%' : 'unknown'}
- toxicity: ${toxicity != null ? toxicity + '%' : 'none'}
- location biome: ${env.biome || p.biome || 'desert'}
- ambient temperature: ${env.temperature != null ? Math.round(env.temperature * 100) + '% of danger threshold' : 'moderate'}
- nearest harvestable plant: ${p.nearestPlantSpecies || p.plantSpecies || 'none in range'}
- current quest: ${p.questTitle || data.questTitle || 'none active'}

TASK: Give the single most important action the player should take right now.

Return ONLY valid JSON:
{"hint":"1 specific action sentence","reason":"why this is urgent or helpful (1 sentence)","nextAction":"the immediate physical step","priority":"low|medium|high"}

Be direct. No greetings. No encouragement. Just the instruction.`;
}

// ── Language Reinforcement ───────────────────────────────────────────────────

export function buildLanguagePrompt(data) {
  return `You are a language tutor. Reinforce one vocabulary word through a short contextual example.

WORD DATA:
- native script: ${data.term || ''}
- language: ${data.language || ''}
- English meaning: ${data.meaning || ''}
- player context: ${data.playerContext || 'exploring desert environment'}
- player mastery: ${data.mastery || 'introduced'} (scale: unseen→introduced→familiar→practiced→reliable→mastered)

TASK: Create one short context sentence and one practice phrase using this word in a game-relevant situation.

Return ONLY valid JSON:
{"term":"the native script","meaning":"English meaning","context":"1 sentence using the word naturally in a desert/ecology/crafting context","practicePhrase":"2-3 word phrase for repetition practice"}

Keep it simple. Match the mastery level — simpler for 'introduced', richer for 'practiced'.`;
}

// ── NPC Context Dialogue ─────────────────────────────────────────────────────

export function buildNPCPrompt(data) {
  return `You are adapting NPC dialogue for a children's bike repair and ecology game. Keep it age-appropriate, short, and educational.
The player character is Zuzu, a boy (he/him pronouns).

NPC: ${data.npcName || 'Desert neighbor'} (${data.npcRole || 'friendly guide'})
Original line: "${data.originalText || 'Hello there.'}"
Active quest: ${data.questTitle || 'none'}
Player language rank: ${data.languageRank || 1}/5
Complexity: ${data.complexityBand || 'starter'} (starter=simple words, guided=richer, builder=technical, advanced=detailed)

TASK: Rewrite the line to match the complexity band. If rank >= 3, include one regional vocabulary word naturally.

Return ONLY valid JSON:
{"text":"the adapted line (max 2 sentences)","tone":"gentle|neutral|urgent|technical","learningCue":"one science/ecology concept mentioned, or null"}

No long speeches. No adult language. Match the band exactly.`;
}

// ── Quiz Question Generation ────────────────────────────────────────────────

export { buildQuizQuestionPrompt } from '../education/quizQuestionGenerator.js';

// ── Quest Guidance ───────────────────────────────────────────────────────────

export function buildQuestPrompt(data) {
  return `You are a quest advisor for a children's game. The player character is Zuzu, a boy (he/him pronouns). Explain what to do next in 1-2 sentences.

QUEST: ${data.questTitle || 'unknown'}
CURRENT STEP: ${data.stepText || 'unknown'}
STEP TYPE: ${data.stepType || 'dialogue'}
PLAYER PROGRESS: ${data.completedQuests || 0} quests completed previously

TASK: Tell the player exactly what to do next and why it matters for learning.

Return ONLY valid JSON:
{"goal":"what to do (1 sentence, imperative verb)","whyItMatters":"why this teaches something real (1 sentence)","nextStep":"the immediate physical action to take"}

Be specific. "Go talk to Mrs. Ramirez" not "find someone to help."`;
}
