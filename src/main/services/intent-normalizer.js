// src/main/services/intent-normalizer.js
// Canonical normalized intent format — ALL input types (text, voice, image) pass through here.
// This is the single source-of-truth interface for what the search pipeline receives.

function createEmptyIntent() {
  return {
    rawInput: '',
    inputMode: 'text',           // text | voice | image
    intent: 'search',            // buy | build | watch | repair | compare | search
    entities: {
      bikeType: null,            // e-bike, dirt-bike, mountain-bike, road-bike, bmx
      partType: null,            // motor, battery, brakes, drivetrain, frame, wheel, chain, etc.
      brand: null,
      model: null,
      wheelSize: null,
      brakeType: null,
      drivetrain: null,
      motorSystem: null,
      voltage: null,
      connectorType: null,
      material: null
    },
    filters: {
      budgetMax: null,
      localOnly: false,
      childSafe: true
    },
    compatibilityHints: {},
    confidence: 0,
    searchTerms: []              // pre-computed search keywords for pipeline
  };
}

// ── Normalize raw text input ────────────────────────────────────────────────
function normalizeTextInput(text) {
  const intent = createEmptyIntent();
  const raw = String(text || '').trim();
  intent.rawInput = raw;
  intent.inputMode = 'text';

  if (!raw) return intent;

  const lower = raw.toLowerCase();

  // Detect intent
  if (/buy|purchase|price|cost|shop|order|where to get/.test(lower)) {
    intent.intent = 'buy';
  } else if (/build|make|assemble|diy|install|mount/.test(lower)) {
    intent.intent = 'build';
  } else if (/watch|video|tutorial|how to|show me/.test(lower)) {
    intent.intent = 'watch';
  } else if (/repair|fix|replace|broken|worn/.test(lower)) {
    intent.intent = 'repair';
  } else if (/compare|versus|vs|better|difference/.test(lower)) {
    intent.intent = 'compare';
  }

  // Extract entities
  _extractEntities(lower, intent);

  intent.confidence = 0.6;
  intent.searchTerms = [raw];
  return intent;
}

// ── Normalize voice transcript (may include speech artifacts) ───────────────
function normalizeVoiceInput(transcript) {
  const intent = createEmptyIntent();
  const raw = String(transcript || '').trim();
  intent.rawInput = raw;
  intent.inputMode = 'voice';

  if (!raw) return intent;

  // Remove voice filler words
  const cleaned = raw
    .replace(/\b(um|uh|like|so|okay|hey|hmm|well)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = cleaned.toLowerCase();

  // Detect intent — voice tends to be more imperative
  if (/find|search|look for|show|where|get me/.test(lower)) {
    intent.intent = 'search';
  } else if (/buy|order|purchase|how much/.test(lower)) {
    intent.intent = 'buy';
  } else if (/build|make|put together|assemble/.test(lower)) {
    intent.intent = 'build';
  } else if (/watch|video|play/.test(lower)) {
    intent.intent = 'watch';
  } else if (/compare|which is better|or/.test(lower)) {
    intent.intent = 'compare';
  } else if (/fix|repair|broken/.test(lower)) {
    intent.intent = 'repair';
  }

  _extractEntities(lower, intent);

  intent.confidence = 0.5; // voice is inherently less precise
  intent.searchTerms = cleaned ? [cleaned] : [raw];
  return intent;
}

// ── Normalize image analysis result ─────────────────────────────────────────
// Accepts the structured output from image-intent-service (or provider-manager.analyzeImage)
function normalizeImageInput(imageResult) {
  const intent = createEmptyIntent();
  intent.inputMode = 'image';

  if (!imageResult) return intent;

  intent.rawInput = imageResult.description || JSON.stringify(imageResult);
  intent.intent = 'search'; // images produce a search-for-this-part intent by default

  // Map image analysis fields to canonical entity slots
  const attrs = imageResult.attributes || {};
  intent.entities.partType = imageResult.category || null;
  intent.entities.brand = attrs.brand || null;
  intent.entities.model = attrs.model || null;
  intent.entities.voltage = attrs.voltage || null;
  intent.entities.connectorType = attrs.connector_type || null;
  intent.entities.material = attrs.material || null;

  // Bike type heuristic from part category
  if (['motor', 'battery', 'controller'].includes(imageResult.category)) {
    intent.entities.bikeType = 'e-bike';
  }

  intent.confidence = Math.min(1, Math.max(0, Number(imageResult.confidence) || 0));
  intent.searchTerms = Array.isArray(imageResult.search_terms) ? imageResult.search_terms : [];

  // Build compatibility hints from attributes
  if (attrs.voltage) intent.compatibilityHints.voltage = attrs.voltage;
  if (attrs.mount_type) intent.compatibilityHints.mountType = attrs.mount_type;
  if (attrs.size) intent.compatibilityHints.size = attrs.size;

  return intent;
}

// ── Convert normalized intent to SearchPipeline.search() arguments ──────────
// The pipeline expects (userQuery, options). This bridges the two.
function intentToSearchArgs(normalizedIntent) {
  // Build query: prefer searchTerms, fall back to rawInput
  const terms = normalizedIntent.searchTerms || [];
  const query = terms.length > 0 ? terms[0] : (normalizedIntent.rawInput || '');

  const options = {};

  // Pass intent as a hint for source selection
  if (normalizedIntent.intent) {
    options.intentHint = normalizedIntent.intent;
  }

  // Pass entity-based filters
  if (normalizedIntent.entities.partType) {
    options.partTypeHint = normalizedIntent.entities.partType;
  }

  // Budget filter
  if (normalizedIntent.filters.budgetMax) {
    options.budgetMax = normalizedIntent.filters.budgetMax;
  }

  // Compatibility metadata for downstream ranking
  options.compatibilityHints = normalizedIntent.compatibilityHints || {};

  // Original normalized intent attached for history/logging
  options._normalizedIntent = normalizedIntent;

  return { query, options };
}

// ── Shared entity extraction ────────────────────────────────────────────────
function _extractEntities(lower, intent) {
  // Part type
  const partMap = {
    motor: /\bmotor\b|engine/,
    battery: /battery|volt(?:age)?|cell|charger/,
    brakes: /brake[s]?|disc|caliper|rotor/,
    drivetrain: /chain|gear|pedal|crank|derailleur|sprocket/,
    frame: /frame|fork/,
    wheel: /wheel|rim|spoke|hub/,
    tire: /tire|tyre|tube/,
    handlebar: /handlebar|grip|stem/,
    seat: /seat|saddle/,
    light: /light|headlight|taillight|reflector/,
    controller: /controller|display|throttle/
  };

  for (const [part, regex] of Object.entries(partMap)) {
    if (regex.test(lower)) {
      intent.entities.partType = part;
      break;
    }
  }

  // Bike type
  if (/e[- ]?bike|electric/.test(lower)) intent.entities.bikeType = 'e-bike';
  else if (/dirt[- ]?bike/.test(lower)) intent.entities.bikeType = 'dirt-bike';
  else if (/mountain/.test(lower)) intent.entities.bikeType = 'mountain-bike';
  else if (/bmx/.test(lower)) intent.entities.bikeType = 'bmx';
  else if (/road[- ]?bike/.test(lower)) intent.entities.bikeType = 'road-bike';

  // Wheel size
  const wheelMatch = lower.match(/(\d{2})\s*(?:inch|")/);
  if (wheelMatch) intent.entities.wheelSize = wheelMatch[1];

  // Voltage
  const voltMatch = lower.match(/(\d+)\s*v(?:olt)?/);
  if (voltMatch) intent.entities.voltage = `${voltMatch[1]}V`;

  // Brand (common bike brands)
  const brands = ['shimano', 'sram', 'bafang', 'bosch', 'yamaha', 'specialized',
    'trek', 'giant', 'cannondale', 'magura', 'tektro', 'avid'];
  for (const brand of brands) {
    if (lower.includes(brand)) {
      intent.entities.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }
}

module.exports = {
  createEmptyIntent,
  normalizeTextInput,
  normalizeVoiceInput,
  normalizeImageInput,
  intentToSearchArgs
};
