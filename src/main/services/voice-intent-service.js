// src/main/services/voice-intent-service.js
// Accepts a raw speech transcript → normalizes it through intent-normalizer →
// returns a normalized intent ready for SearchPipeline.search().
//
// Architecture decision: actual speech-to-text happens in the renderer (Web Speech API)
// because Chromium owns the microphone. The renderer sends the raw transcript string
// through preload IPC; all intelligence (parsing, intent extraction) stays here in main.

const { normalizeVoiceInput, intentToSearchArgs } = require('./intent-normalizer');

class VoiceIntentService {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  // Parse transcript into normalizedIntent + searchArgs, optionally using AI
  async parseTranscript(transcript) {
    const raw = String(transcript || '').trim();
    if (!raw) {
      const empty = normalizeVoiceInput('');
      return {
        normalizedIntent: empty,
        searchArgs: intentToSearchArgs(empty),
        aiEnhanced: false
      };
    }

    // Start with the deterministic heuristic normalizer
    let normalizedIntent = normalizeVoiceInput(raw);
    let aiEnhanced = false;

    // For longer/complex utterances, try AI-enhanced parsing
    if (raw.split(/\s+/).length > 3 && this.providerManager) {
      try {
        const enhanced = await this._aiParse(raw);
        if (enhanced && enhanced.confidence > normalizedIntent.confidence) {
          normalizedIntent = enhanced;
          aiEnhanced = true;
        }
      } catch (error) {
        console.warn('[VoiceIntentService] AI parse failed, using heuristic:', error.message);
      }
    }

    const searchArgs = intentToSearchArgs(normalizedIntent);
    return { normalizedIntent, searchArgs, aiEnhanced };
  }

  // Parse transcript AND immediately run the search pipeline
  async parseAndSearch(transcript, searchPipeline) {
    const { normalizedIntent, searchArgs, aiEnhanced } = await this.parseTranscript(transcript);

    if (!searchArgs.query) {
      return {
        normalizedIntent,
        aiEnhanced,
        searchResult: { query: '', results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0 }
      };
    }

    const searchResult = await searchPipeline.search(searchArgs.query, searchArgs.options);
    return { normalizedIntent, aiEnhanced, searchResult };
  }

  async _aiParse(raw) {
    if (!this.providerManager || typeof this.providerManager.executeWithOrchestration !== 'function') {
      return null;
    }

    const prompt = `Parse this child's spoken bike-related request into structured intent.

TRANSCRIPT: "${raw}"

OUTPUT FORMAT (JSON only):
{
  "intent": "search|buy|build|watch|repair|compare",
  "entities": {
    "bikeType": null,
    "partType": null,
    "brand": null,
    "model": null,
    "wheelSize": null,
    "voltage": null
  },
  "searchTerms": [],
  "confidence": 0.0
}

RULES:
- The user is a 9-year-old child, expect informal language
- searchTerms should be 1-5 clean keywords for searching`;

    const result = await Promise.race([
      this.providerManager.executeWithOrchestration({
        taskType: 'structured_parsing',
        prompt,
        expectedFormat: 'json',
        metadata: { fallbackData: null }
      }),
      new Promise((resolve) => setTimeout(() => resolve(null), 6000))
    ]);

    if (!result || !result.success || !result.data) {
      return null;
    }

    const d = result.data;
    // Merge AI result into a full normalized intent
    const { normalizeVoiceInput: _, createEmptyIntent, ...rest } = require('./intent-normalizer');
    const intent = require('./intent-normalizer').createEmptyIntent();
    intent.rawInput = raw;
    intent.inputMode = 'voice';
    intent.intent = d.intent || 'search';
    intent.entities = { ...intent.entities, ...(d.entities || {}) };
    intent.searchTerms = Array.isArray(d.searchTerms) ? d.searchTerms : [raw];
    intent.confidence = Math.min(1, Math.max(0, Number(d.confidence) || 0));
    return intent;
  }
}

module.exports = { VoiceIntentService };
