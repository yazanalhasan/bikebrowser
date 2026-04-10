// src/main/services/image-intent-service.js
// Accepts image payloads → calls provider-manager for AI vision analysis →
// normalizes the result through intent-normalizer → returns normalized intent
// that SearchPipeline.search() can consume.
//
// Architecture decision: image analysis happens exclusively in the main process.
// The renderer sends raw bytes through preload IPC; secrets/API keys never leave main.

const { normalizeImageInput, intentToSearchArgs } = require('./intent-normalizer');

const IMAGE_ANALYSIS_PROMPT = `You are a bike parts identification assistant for a child's bike-building project. Analyze the image and identify any bicycle, e-bike, or mechanical parts visible.

OUTPUT FORMAT (JSON only, no markdown):
{
  "type": "bike_part",
  "category": "motor|battery|brakes|drivetrain|frame|wheel|tire|chain|pedal|seat|handlebar|light|tool|accessory|controller|unknown",
  "attributes": {
    "brand": "",
    "model": "",
    "mount_type": "",
    "voltage": "",
    "connector_type": "",
    "size": "",
    "material": "",
    "color": ""
  },
  "confidence": 0.0,
  "description": "one-sentence child-friendly description",
  "search_terms": ["term1", "term2"]
}

RULES:
- Always assume the user is a child building a bike project
- Identify the most prominent part in the image
- Generate 2-5 child-friendly search terms
- If you cannot identify the part, set confidence below 0.3 and category to "unknown"`;

class ImageIntentService {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  // Analyse an image and return { normalizedIntent, searchArgs, rawAnalysis }
  async analyzeImage(imageBase64) {
    if (!imageBase64) {
      const empty = normalizeImageInput(null);
      return {
        normalizedIntent: empty,
        searchArgs: intentToSearchArgs(empty),
        rawAnalysis: null
      };
    }

    let rawAnalysis;
    try {
      rawAnalysis = await this._callVisionProvider(imageBase64);
    } catch (error) {
      console.error('[ImageIntentService] Vision call failed:', error.message);
      rawAnalysis = this._fallbackAnalysis();
    }

    const normalizedIntent = normalizeImageInput(rawAnalysis);
    const searchArgs = intentToSearchArgs(normalizedIntent);

    return { normalizedIntent, searchArgs, rawAnalysis };
  }

  // Analyse image AND immediately run the search pipeline
  async analyzeAndSearch(imageBase64, searchPipeline) {
    const { normalizedIntent, searchArgs, rawAnalysis } = await this.analyzeImage(imageBase64);

    if (!searchArgs.query) {
      return {
        normalizedIntent,
        rawAnalysis,
        searchResult: { query: '', results: [], grouped: { build: [], buy: [], watch: [] }, totalResults: 0 }
      };
    }

    const searchResult = await searchPipeline.search(searchArgs.query, searchArgs.options);
    return { normalizedIntent, rawAnalysis, searchResult };
  }

  async _callVisionProvider(imageBase64) {
    if (!this.providerManager || typeof this.providerManager.analyzeImage !== 'function') {
      console.warn('[ImageIntentService] No vision-capable provider available, using fallback');
      return this._fallbackAnalysis();
    }

    const result = await this.providerManager.analyzeImage(imageBase64, IMAGE_ANALYSIS_PROMPT);

    if (!result || !result.success || !result.data) {
      return this._fallbackAnalysis();
    }

    const d = result.data;
    return {
      type: d.type || 'bike_part',
      category: d.category || 'unknown',
      attributes: d.attributes || {},
      confidence: Number(d.confidence) || 0,
      description: d.description || '',
      search_terms: Array.isArray(d.search_terms) ? d.search_terms : []
    };
  }

  _fallbackAnalysis() {
    return {
      type: 'bike_part',
      category: 'unknown',
      attributes: {},
      confidence: 0,
      description: 'Image analysis unavailable — try a text search instead',
      search_terms: []
    };
  }
}

module.exports = { ImageIntentService };
