const { createTaskSchema, validateJSON } = require('../main/deepseek/provider-utils');

const IMAGE_ANALYSIS_PROMPT = `You are a bike parts identification assistant. Analyze the provided image and identify any bicycle or e-bike parts, tools, or components visible.

OUTPUT FORMAT (JSON only, no markdown):
{
  "type": "bike_part",
  "category": "motor|battery|brakes|drivetrain|frame|wheel|tire|chain|pedal|seat|handlebar|light|tool|accessory|unknown",
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
  "description": "",
  "search_terms": []
}

RULES:
- Always assume the user is a child building a bike project
- Identify the most prominent part in the image
- Generate child-friendly search terms
- If you cannot identify the part, set confidence below 0.3 and category to "unknown"
- search_terms should be 2-5 specific queries useful for finding this part or similar parts`;

class ImageToQuery {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  async analyze(imageInput) {
    if (!imageInput) {
      return this._unknownResult('No image provided');
    }

    const base64 = typeof imageInput === 'string' ? imageInput : null;
    if (!base64) {
      return this._unknownResult('Unsupported image format');
    }

    try {
      const result = await this.providerManager.analyzeImage(base64, IMAGE_ANALYSIS_PROMPT);

      if (!result || !result.success || !result.data) {
        return this._unknownResult('Image analysis failed');
      }

      const data = result.data;
      return {
        type: data.type || 'bike_part',
        category: this._normalizeCategory(data.category),
        attributes: {
          brand: data.attributes?.brand || '',
          model: data.attributes?.model || '',
          mount_type: data.attributes?.mount_type || '',
          voltage: data.attributes?.voltage || '',
          connector_type: data.attributes?.connector_type || '',
          size: data.attributes?.size || '',
          material: data.attributes?.material || '',
          color: data.attributes?.color || ''
        },
        confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0)),
        description: data.description || '',
        search_terms: Array.isArray(data.search_terms) ? data.search_terms.slice(0, 5) : []
      };
    } catch (error) {
      console.error('[ImageToQuery] Analysis error:', error.message);
      return this._unknownResult(error.message);
    }
  }

  _normalizeCategory(raw) {
    const valid = [
      'motor', 'battery', 'brakes', 'drivetrain', 'frame',
      'wheel', 'tire', 'chain', 'pedal', 'seat', 'handlebar',
      'light', 'tool', 'accessory'
    ];
    const normalized = String(raw || '').toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'unknown';
  }

  _unknownResult(reason) {
    return {
      type: 'bike_part',
      category: 'unknown',
      attributes: {
        brand: '', model: '', mount_type: '',
        voltage: '', connector_type: '', size: '',
        material: '', color: ''
      },
      confidence: 0,
      description: reason,
      search_terms: []
    };
  }
}

module.exports = { ImageToQuery, IMAGE_ANALYSIS_PROMPT };
