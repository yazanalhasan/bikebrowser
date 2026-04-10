const VOICE_PARSE_PROMPT = `You are a voice input parser for a kid-friendly bike building app. A child has spoken a query using voice dictation. Parse the raw transcript into a structured search intent.

OUTPUT FORMAT (JSON only, no markdown):
{
  "raw_text": "",
  "intent": "search|compare|learn",
  "category": "motor|battery|brakes|drivetrain|frame|wheel|tire|chain|pedal|seat|handlebar|light|tool|accessory|general",
  "structured_query": {
    "part_type": "",
    "brand": "",
    "attributes": {},
    "action": ""
  },
  "search_terms": [],
  "confidence": 0.0
}

RULES:
- The user is a 9-year-old child; expect informal language, mispronunciations, and simple descriptions
- "search" = looking for a part or video
- "compare" = comparing two or more items ("which is better", "should I get X or Y")
- "learn" = asking how something works or how to do something
- search_terms should be 1-5 clean keywords suitable for YouTube / web search
- If the transcript is unclear, still produce best-effort search_terms with low confidence`;

class VoiceToQuery {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  async parse(transcript) {
    const raw = String(transcript || '').trim();
    if (!raw) {
      return this._emptyResult('');
    }

    // Quick heuristic for very short / simple queries — skip AI
    if (raw.split(/\s+/).length <= 3) {
      return this._heuristicParse(raw);
    }

    try {
      const result = await this.providerManager.executeWithOrchestration({
        taskType: 'structured_parsing',
        prompt: `${VOICE_PARSE_PROMPT}\n\nTRANSCRIPT: "${raw}"`,
        expectedFormat: 'json',
        metadata: {
          fallbackData: this._heuristicParse(raw)
        }
      });

      if (!result || !result.success || !result.data) {
        return this._heuristicParse(raw);
      }

      const data = result.data;
      return {
        raw_text: raw,
        intent: this._normalizeIntent(data.intent),
        category: this._normalizeCategory(data.category),
        structured_query: data.structured_query || { part_type: '', brand: '', attributes: {}, action: '' },
        search_terms: Array.isArray(data.search_terms) ? data.search_terms.slice(0, 5) : [raw],
        confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0))
      };
    } catch (error) {
      console.error('[VoiceToQuery] Parse error:', error.message);
      return this._heuristicParse(raw);
    }
  }

  _heuristicParse(raw) {
    const text = raw.toLowerCase();
    let intent = 'search';
    if (/which|better|compare|versus|vs|or/.test(text)) {
      intent = 'compare';
    } else if (/how|why|what is|explain|learn|teach/.test(text)) {
      intent = 'learn';
    }

    const categoryMap = {
      motor: /motor|engine/,
      battery: /battery|volt|charge/,
      brakes: /brake|stop/,
      drivetrain: /chain|gear|pedal|crank|derailleur/,
      frame: /frame|fork/,
      wheel: /wheel|rim|spoke/,
      tire: /tire|tyre|tube/,
      handlebar: /handlebar|grip|stem/,
      seat: /seat|saddle/,
      light: /light|reflector/
    };

    let category = 'general';
    for (const [cat, pattern] of Object.entries(categoryMap)) {
      if (pattern.test(text)) {
        category = cat;
        break;
      }
    }

    // Build search terms by removing filler words
    const filler = /\b(um|uh|like|so|the|a|an|is|it|can|you|i|want|need|find|show|me|get)\b/gi;
    const cleaned = raw.replace(filler, ' ').replace(/\s+/g, ' ').trim();
    const terms = cleaned ? [cleaned] : [raw];

    return {
      raw_text: raw,
      intent,
      category,
      structured_query: { part_type: '', brand: '', attributes: {}, action: '' },
      search_terms: terms,
      confidence: 0.4
    };
  }

  _normalizeIntent(raw) {
    const valid = ['search', 'compare', 'learn'];
    const normalized = String(raw || '').toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'search';
  }

  _normalizeCategory(raw) {
    const valid = [
      'motor', 'battery', 'brakes', 'drivetrain', 'frame',
      'wheel', 'tire', 'chain', 'pedal', 'seat', 'handlebar',
      'light', 'tool', 'accessory'
    ];
    const normalized = String(raw || '').toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'general';
  }

  _emptyResult(raw) {
    return {
      raw_text: raw,
      intent: 'search',
      category: 'general',
      structured_query: { part_type: '', brand: '', attributes: {}, action: '' },
      search_terms: [],
      confidence: 0
    };
  }
}

module.exports = { VoiceToQuery, VOICE_PARSE_PROMPT };
