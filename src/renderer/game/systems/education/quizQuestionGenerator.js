/**
 * Quiz Question Generator — produces varied, standards-aligned questions
 * using the AI pipeline with a rich deterministic fallback bank.
 *
 * Question design targets Arizona Academic Standards Assessment (AASA)
 * question styles: multi-step word problems, estimation, geometry,
 * data interpretation, fractions, ratios — not just formula plug-in.
 *
 * Two paths:
 *   1. AI-generated — contextual questions from player state + game data
 *   2. Fallback bank — curated question pool organized by topic, tier,
 *      and Arizona standard, with plausible distractors (not joke answers)
 *
 * Used by:
 *   - PhysicsEducationSystem (replaces repetitive d=s×t questions)
 *   - Quest quiz steps (optional upgrade from hardcoded questions)
 */

// ── Arizona Standards Reference ─────────────────────────────────────────────
// Grades 3–6 alignment:
//   3.OA  — Multiplication/division word problems, patterns
//   3.MD  — Area, perimeter, measurement
//   4.OA  — Multi-step word problems, factors/multiples
//   4.NF  — Fractions, equivalence, operations
//   4.MD  — Unit conversion, area/perimeter, angles
//   5.NF  — Fraction multiplication/division
//   5.MD  — Volume, unit conversion
//   6.RP  — Ratios, unit rates, percentages
//   6.EE  — Expressions, equations, variables
//   6.SP  — Data interpretation, mean/median

// ── Fallback Question Bank ──────────────────────────────────────────────────

const QUESTION_BANK = [

  // ── TIER 1: Foundational (grades 3–4) ───────────────────────────────────

  // Measurement & geometry in bike context
  {
    tier: 1, topic: 'measurement', standard: '3.MD.4',
    question: 'Zuzu measured 4 bike tires. Their widths were 2 inches, 3 inches, 2 inches, and 1 inch. What is the most common tire width?',
    choices: [
      { label: '2 inches', correct: true },
      { label: '3 inches', correct: false },
      { label: '1 inch', correct: false },
      { label: '4 inches', correct: false },
    ],
    explanation: '2 inches appears twice — more than any other width. That makes it the mode.',
    concept: 'mode (most frequent value)',
  },
  {
    tier: 1, topic: 'geometry', standard: '3.MD.8',
    question: 'A square patch kit is 3 inches on each side. What is the perimeter of the patch?',
    choices: [
      { label: '12 inches', correct: true },
      { label: '9 inches', correct: false },
      { label: '6 inches', correct: false },
      { label: '15 inches', correct: false },
    ],
    explanation: 'Perimeter = 4 × side length. 4 × 3 = 12 inches.',
    concept: 'perimeter of a square',
  },
  {
    tier: 1, topic: 'multiplication', standard: '3.OA.3',
    question: 'Each bike wheel has 24 spokes. How many spokes do 2 wheels have altogether?',
    choices: [
      { label: '48 spokes', correct: true },
      { label: '26 spokes', correct: false },
      { label: '46 spokes', correct: false },
      { label: '36 spokes', correct: false },
    ],
    explanation: '24 × 2 = 48. When we have equal groups, we multiply.',
    concept: 'multiplication as equal groups',
  },
  {
    tier: 1, topic: 'division', standard: '3.OA.2',
    question: 'Mr. Chen has 18 bolts to share equally among 3 bike builds. How many bolts per bike?',
    choices: [
      { label: '6 bolts', correct: true },
      { label: '5 bolts', correct: false },
      { label: '9 bolts', correct: false },
      { label: '15 bolts', correct: false },
    ],
    explanation: '18 ÷ 3 = 6. Division splits a total into equal groups.',
    concept: 'division as equal sharing',
  },
  {
    tier: 1, topic: 'patterns', standard: '3.OA.9',
    question: 'The temperature in the desert went: 80°F, 85°F, 90°F, 95°F. What comes next?',
    choices: [
      { label: '100°F', correct: true },
      { label: '96°F', correct: false },
      { label: '105°F', correct: false },
      { label: '99°F', correct: false },
    ],
    explanation: 'The pattern adds 5 each time: 80, 85, 90, 95, 100.',
    concept: 'arithmetic patterns',
  },
  {
    tier: 1, topic: 'area', standard: '3.MD.7',
    question: 'A rectangular tool mat is 5 inches long and 3 inches wide. What is its area?',
    choices: [
      { label: '15 square inches', correct: true },
      { label: '16 square inches', correct: false },
      { label: '8 square inches', correct: false },
      { label: '12 square inches', correct: false },
    ],
    explanation: 'Area = length × width. 5 × 3 = 15 square inches.',
    concept: 'area of a rectangle',
  },

  // ── TIER 2: Building (grades 4–5) ─────────────────────────────────────

  {
    tier: 2, topic: 'multi_step', standard: '4.OA.3',
    question: 'Zuzu has 50 Zuzubucks. A tire costs 12 Zuzubucks and a tube costs 8 Zuzubucks. If he buys one of each, how much does he have left?',
    choices: [
      { label: '30 Zuzubucks', correct: true },
      { label: '20 Zuzubucks', correct: false },
      { label: '38 Zuzubucks', correct: false },
      { label: '32 Zuzubucks', correct: false },
    ],
    explanation: '12 + 8 = 20 spent. 50 − 20 = 30 left. Multi-step: add, then subtract.',
    concept: 'multi-step word problems',
  },
  {
    tier: 2, topic: 'fractions', standard: '4.NF.1',
    question: 'Mrs. Ramirez used 2/4 of a roll of tape. Which fraction is equivalent?',
    choices: [
      { label: '1/2', correct: true },
      { label: '2/3', correct: false },
      { label: '1/4', correct: false },
      { label: '3/4', correct: false },
    ],
    explanation: '2/4 simplifies to 1/2. Both numerator and denominator divide by 2.',
    concept: 'equivalent fractions',
  },
  {
    tier: 2, topic: 'measurement', standard: '4.MD.1',
    question: 'A desert trail is 3 kilometers long. How many meters is that?',
    choices: [
      { label: '3,000 meters', correct: true },
      { label: '300 meters', correct: false },
      { label: '30 meters', correct: false },
      { label: '30,000 meters', correct: false },
    ],
    explanation: '1 kilometer = 1,000 meters. 3 × 1,000 = 3,000.',
    concept: 'unit conversion (km to m)',
  },
  {
    tier: 2, topic: 'angles', standard: '4.MD.5',
    question: 'Zuzu turns his handlebars a quarter turn. How many degrees is that?',
    choices: [
      { label: '90°', correct: true },
      { label: '45°', correct: false },
      { label: '180°', correct: false },
      { label: '60°', correct: false },
    ],
    explanation: 'A full turn is 360°. A quarter turn = 360 ÷ 4 = 90°.',
    concept: 'angle measurement',
  },
  {
    tier: 2, topic: 'factors', standard: '4.OA.4',
    question: 'A bike gear has 36 teeth. Which of these is NOT a factor of 36?',
    choices: [
      { label: '8', correct: true },
      { label: '6', correct: false },
      { label: '9', correct: false },
      { label: '12', correct: false },
    ],
    explanation: '36 ÷ 8 = 4.5 (not a whole number). 6, 9, and 12 all divide evenly into 36.',
    concept: 'factors and divisibility',
  },
  {
    tier: 2, topic: 'fractions', standard: '4.NF.3',
    question: 'Zuzu drank 3/8 of his water bottle, then drank 2/8 more. How much has he drunk total?',
    choices: [
      { label: '5/8', correct: true },
      { label: '5/16', correct: false },
      { label: '1/2', correct: false },
      { label: '6/8', correct: false },
    ],
    explanation: 'Same denominator: 3/8 + 2/8 = 5/8. Add numerators, keep the denominator.',
    concept: 'adding fractions with like denominators',
  },
  {
    tier: 2, topic: 'estimation', standard: '4.OA.3',
    question: 'A bike ride is 487 meters. About how many meters is that, rounded to the nearest hundred?',
    choices: [
      { label: '500 meters', correct: true },
      { label: '400 meters', correct: false },
      { label: '490 meters', correct: false },
      { label: '480 meters', correct: false },
    ],
    explanation: '487 rounds to 500. The tens digit (8) is 5 or more, so round up.',
    concept: 'rounding and estimation',
  },

  // ── TIER 3: Reasoning (grades 5–6) ────────────────────────────────────

  {
    tier: 3, topic: 'ratios', standard: '6.RP.1',
    question: 'A bike\'s front gear has 40 teeth and the rear gear has 20 teeth. What is the gear ratio?',
    choices: [
      { label: '2 to 1', correct: true },
      { label: '1 to 2', correct: false },
      { label: '20 to 1', correct: false },
      { label: '3 to 1', correct: false },
    ],
    explanation: '40:20 simplifies to 2:1. For every 1 turn of the front gear, the rear turns 2 times.',
    concept: 'ratios and simplification',
  },
  {
    tier: 3, topic: 'percentages', standard: '6.RP.3',
    question: 'A tire is rated to 100 PSI. It\'s currently at 65 PSI. What percentage of full pressure is that?',
    choices: [
      { label: '65%', correct: true },
      { label: '35%', correct: false },
      { label: '6.5%', correct: false },
      { label: '75%', correct: false },
    ],
    explanation: '65 ÷ 100 = 0.65 = 65%. Percent means "per hundred."',
    concept: 'percentages',
  },
  {
    tier: 3, topic: 'volume', standard: '5.MD.3',
    question: 'A water container is 10 cm long, 5 cm wide, and 8 cm tall. What is its volume?',
    choices: [
      { label: '400 cubic cm', correct: true },
      { label: '23 cubic cm', correct: false },
      { label: '80 cubic cm', correct: false },
      { label: '380 cubic cm', correct: false },
    ],
    explanation: 'Volume = length × width × height. 10 × 5 × 8 = 400 cm³.',
    concept: 'volume of rectangular prism',
  },
  {
    tier: 3, topic: 'unit_rate', standard: '6.RP.2',
    question: 'Zuzu rode 12 miles in 2 hours. What was his speed in miles per hour?',
    choices: [
      { label: '6 miles per hour', correct: true },
      { label: '24 miles per hour', correct: false },
      { label: '10 miles per hour', correct: false },
      { label: '14 miles per hour', correct: false },
    ],
    explanation: 'Unit rate = 12 ÷ 2 = 6 miles per hour. Divide total by time.',
    concept: 'unit rates',
  },
  {
    tier: 3, topic: 'expressions', standard: '6.EE.2',
    question: 'A bike shop charges $5 per tube plus a $3 service fee. Which expression gives the total cost for t tubes?',
    choices: [
      { label: '5t + 3', correct: true },
      { label: '5 + 3t', correct: false },
      { label: '8t', correct: false },
      { label: '5 × 3 × t', correct: false },
    ],
    explanation: 'Each tube costs $5 (that\'s 5t), plus a one-time $3 fee = 5t + 3.',
    concept: 'writing expressions with variables',
  },
  {
    tier: 3, topic: 'data', standard: '6.SP.3',
    question: 'Zuzu timed 5 laps: 30s, 28s, 32s, 25s, 35s. What is the mean (average) lap time?',
    choices: [
      { label: '30 seconds', correct: true },
      { label: '28 seconds', correct: false },
      { label: '32 seconds', correct: false },
      { label: '25 seconds', correct: false },
    ],
    explanation: 'Mean = (30+28+32+25+35) ÷ 5 = 150 ÷ 5 = 30 seconds.',
    concept: 'mean (average)',
  },
  {
    tier: 3, topic: 'fractions', standard: '5.NF.4',
    question: 'A recipe for tire sealant needs 3/4 cup of latex. Zuzu wants to make 1/2 a batch. How much latex?',
    choices: [
      { label: '3/8 cup', correct: true },
      { label: '3/2 cups', correct: false },
      { label: '1/4 cup', correct: false },
      { label: '3/6 cup', correct: false },
    ],
    explanation: '3/4 × 1/2 = 3/8. Multiply numerators and denominators.',
    concept: 'multiplying fractions',
  },

  // ── TIER 4: Applied (grade 6+) ────────────────────────────────────────

  {
    tier: 4, topic: 'proportions', standard: '6.RP.3',
    question: 'A map scale says 1 inch = 5 miles. Two desert landmarks are 3.5 inches apart on the map. How far apart are they?',
    choices: [
      { label: '17.5 miles', correct: true },
      { label: '8.5 miles', correct: false },
      { label: '15 miles', correct: false },
      { label: '35 miles', correct: false },
    ],
    explanation: '3.5 × 5 = 17.5 miles. Use the scale as a multiplier.',
    concept: 'scale and proportional reasoning',
  },
  {
    tier: 4, topic: 'equations', standard: '6.EE.7',
    question: 'A bike frame weighs 4 kg. With gear loaded, it weighs 13 kg. If each bag weighs the same, and there are 3 bags, how much does each weigh?',
    choices: [
      { label: '3 kg', correct: true },
      { label: '4.3 kg', correct: false },
      { label: '9 kg', correct: false },
      { label: '3.5 kg', correct: false },
    ],
    explanation: '13 − 4 = 9 kg of gear. 9 ÷ 3 = 3 kg per bag. Solve: 4 + 3b = 13.',
    concept: 'solving one-step equations',
  },
  {
    tier: 4, topic: 'geometry', standard: '6.G.1',
    question: 'A triangular bike flag has a base of 8 inches and height of 10 inches. What is its area?',
    choices: [
      { label: '40 square inches', correct: true },
      { label: '80 square inches', correct: false },
      { label: '18 square inches', correct: false },
      { label: '36 square inches', correct: false },
    ],
    explanation: 'Triangle area = (base × height) ÷ 2 = (8 × 10) ÷ 2 = 40.',
    concept: 'area of a triangle',
  },
  {
    tier: 4, topic: 'circumference', standard: '7.G.4',
    question: 'A bike wheel has a diameter of 26 inches. Approximately how far does it travel in one full rotation? (Use π ≈ 3.14)',
    choices: [
      { label: 'About 82 inches', correct: true },
      { label: 'About 52 inches', correct: false },
      { label: 'About 163 inches', correct: false },
      { label: 'About 26 inches', correct: false },
    ],
    explanation: 'Circumference = π × d = 3.14 × 26 ≈ 81.6, about 82 inches.',
    concept: 'circumference',
  },
  {
    tier: 4, topic: 'negative_numbers', standard: '6.NS.5',
    question: 'The desert was 95°F at noon. By midnight it dropped 30°F, then another 10°F by dawn. What was the dawn temperature?',
    choices: [
      { label: '55°F', correct: true },
      { label: '65°F', correct: false },
      { label: '75°F', correct: false },
      { label: '45°F', correct: false },
    ],
    explanation: '95 − 30 = 65, then 65 − 10 = 55°F. Track each change step by step.',
    concept: 'multi-step temperature change',
  },
  {
    tier: 4, topic: 'data', standard: '6.SP.5',
    question: 'Five riders\' speeds: 8, 12, 10, 15, 10 mph. What is the median speed?',
    choices: [
      { label: '10 mph', correct: true },
      { label: '11 mph', correct: false },
      { label: '12 mph', correct: false },
      { label: '8 mph', correct: false },
    ],
    explanation: 'Sorted: 8, 10, 10, 12, 15. The middle value is 10. That\'s the median.',
    concept: 'median',
  },
];

// ── Tier mapping from difficulty band ───────────────────────────────────────

const BAND_TO_TIER = {
  starter: 1,
  guided: 2,
  builder: 3,
  advanced: 4,
};

// Track used questions to avoid repeats within a session
const _usedQuestionIds = new Set();

/**
 * Pick a fallback question from the bank.
 *
 * @param {object} opts
 * @param {string} [opts.band] - difficulty band from dialogueDifficulty
 * @param {number} [opts.tier] - explicit tier (1–4), overrides band
 * @param {string} [opts.topic] - preferred topic filter
 * @param {string} [opts.questContext] - current quest id for context
 * @returns {object} question object with { question, choices, explanation, concept, topic, tier, standard }
 */
export function pickFallbackQuestion({ band, tier, topic } = {}) {
  const targetTier = tier || BAND_TO_TIER[band] || 1;

  // Filter to matching tier, allow ±1 tier for variety
  let pool = QUESTION_BANK.filter(
    (q) => Math.abs(q.tier - targetTier) <= 1
  );

  // Prefer exact tier match and requested topic
  if (topic) {
    const topicMatches = pool.filter((q) => q.topic === topic);
    if (topicMatches.length > 0) pool = topicMatches;
  }

  // Exclude recently used
  let unused = pool.filter((q) => !_usedQuestionIds.has(_qid(q)));
  if (unused.length === 0) {
    // All used — reset and allow all
    _usedQuestionIds.clear();
    unused = pool;
  }

  // Weighted random: prefer exact tier
  const exactTier = unused.filter((q) => q.tier === targetTier);
  const source = exactTier.length >= 2 ? exactTier : unused;

  const picked = source[Math.floor(Math.random() * source.length)];
  _usedQuestionIds.add(_qid(picked));

  return { ...picked, source: 'fallback_bank' };
}

function _qid(q) {
  return `${q.tier}_${q.topic}_${q.question.slice(0, 30)}`;
}

// ── AI Prompt Builder ───────────────────────────────────────────────────────

/**
 * Build a prompt for AI-generated quiz questions aligned to Arizona standards.
 *
 * @param {object} data
 * @param {string} data.band - difficulty band
 * @param {object} data.gameContext - player state, quest, environment
 * @param {string} [data.topic] - preferred math topic
 * @param {number} [data.tier] - explicit tier
 * @returns {string} prompt for AI provider
 */
export function buildQuizQuestionPrompt(data) {
  const tier = data.tier || BAND_TO_TIER[data.band] || 1;
  const ctx = data.gameContext || {};

  const tierDescriptions = {
    1: 'Grade 3–4: basic multiplication, division, area, perimeter, simple patterns. Use small whole numbers.',
    2: 'Grade 4–5: multi-step word problems, fractions, unit conversion, angles, estimation, factors.',
    3: 'Grade 5–6: ratios, percentages, volume, unit rates, mean/median, fraction operations, variables.',
    4: 'Grade 6+: proportions, equations with variables, triangle area, circumference, multi-step reasoning.',
  };

  return `You are generating a math question for a children's bike repair and desert ecology game, aligned to Arizona state testing standards (AASA).

DIFFICULTY TIER: ${tier}
GRADE LEVEL GUIDE: ${tierDescriptions[tier] || tierDescriptions[1]}
GAME CONTEXT:
- current quest: ${ctx.questTitle || 'exploring'}
- environment: ${ctx.biome || 'Arizona desert neighborhood'}
- player items: ${ctx.recentItems?.join(', ') || 'bike tools, plants'}
- recent activity: ${ctx.recentActivity || 'bike repair and exploration'}

REQUIREMENTS:
- The main character is Zuzu, a BOY (use he/him pronouns if referencing Zuzu)
- The question MUST be a math problem, not trivia or recall
- Frame it in a real-world context from the game (bikes, desert, tools, plants, weather, distance)
- Use PLAUSIBLE wrong answers based on common student mistakes (not silly/impossible answers)
- Common mistake types: forgetting to carry, off-by-one, using wrong operation, not reading carefully
- Include 4 answer choices (exactly 1 correct)
- Keep question text under 40 words
- Include a 1-sentence explanation showing the math steps

QUESTION VARIETY — pick ONE type at random:
- Word problem requiring 2+ steps
- Estimation / rounding
- Fraction or ratio in context
- Geometry (perimeter, area, angle, circumference)
- Data interpretation (read a set of numbers)
- Pattern recognition
- Unit conversion
- Expression with a variable

Return ONLY valid JSON:
{"question":"the question text","choices":[{"label":"answer A","correct":false},{"label":"answer B","correct":true},{"label":"answer C","correct":false},{"label":"answer D","correct":false}],"explanation":"1 sentence showing the math","concept":"the math concept tested","topic":"one of: measurement, geometry, fractions, ratios, data, patterns, multi_step, expressions, estimation","standard":"Arizona/Common Core standard code like 4.OA.3"}

Shuffle which position (A/B/C/D) has the correct answer. Do NOT always put it first.`;
}

// ── AI Response Validator ───────────────────────────────────────────────────

/**
 * Validate and normalize an AI-generated question response.
 * Returns null if the response is malformed.
 */
export function validateAIQuestion(response) {
  if (!response || typeof response !== 'object') return null;
  if (!response.question || typeof response.question !== 'string') return null;
  if (!Array.isArray(response.choices) || response.choices.length < 3) return null;

  // Must have exactly one correct answer
  const correctCount = response.choices.filter((c) => c.correct === true).length;
  if (correctCount !== 1) return null;

  // All choices must have labels
  if (response.choices.some((c) => !c.label)) return null;

  return {
    question: response.question,
    choices: response.choices.map((c) => ({ label: String(c.label), correct: !!c.correct })),
    explanation: response.explanation || '',
    concept: response.concept || '',
    topic: response.topic || 'general',
    standard: response.standard || '',
    source: 'ai',
  };
}

// ── Reset (for new game) ────────────────────────────────────────────────────

export function resetQuizGenerator() {
  _usedQuestionIds.clear();
}
