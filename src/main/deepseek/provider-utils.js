function stripCodeFences(value) {
  let cleaned = String(value || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function parseJSONResponse(value) {
  try {
    return {
      valid: true,
      data: JSON.parse(stripCodeFences(value))
    };
  } catch (error) {
    return {
      valid: false,
      data: null,
      error: error.message
    };
  }
}

function validateSchema(data, schema, path = 'root') {
  if (!schema) {
    return { valid: true, data };
  }

  if (typeof schema === 'string') {
    const valid = schema === 'array'
      ? Array.isArray(data)
      : schema === 'number'
        ? typeof data === 'number' && Number.isFinite(data)
        : typeof data === schema;
    return valid
      ? { valid: true, data }
      : { valid: false, error: `${path} expected ${schema}` };
  }

  if (schema.enum) {
    return schema.enum.includes(data)
      ? { valid: true, data }
      : { valid: false, error: `${path} expected one of ${schema.enum.join(', ')}` };
  }

  if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      return { valid: false, error: `${path} expected array` };
    }

    if (!schema.items) {
      return { valid: true, data };
    }

    for (let index = 0; index < data.length; index += 1) {
      const nested = validateSchema(data[index], schema.items, `${path}[${index}]`);
      if (!nested.valid) {
        return nested;
      }
    }

    return { valid: true, data };
  }

  if (schema.type === 'object') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, error: `${path} expected object` };
    }

    const required = schema.required || [];
    for (const key of required) {
      if (!(key in data)) {
        return { valid: false, error: `${path}.${key} is required` };
      }
    }

    const properties = schema.properties || {};
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (!(key in data)) {
        continue;
      }

      const nested = validateSchema(data[key], propertySchema, `${path}.${key}`);
      if (!nested.valid) {
        return nested;
      }
    }

    return { valid: true, data };
  }

  return { valid: true, data };
}

function validateJSON(response, schema) {
  const parsed = typeof response === 'string'
    ? parseJSONResponse(response)
    : { valid: true, data: response };

  if (!parsed.valid) {
    return parsed;
  }

  return validateSchema(parsed.data, schema);
}

function hasLowHallucinationIndicators(rawText) {
  const text = String(rawText || '').toLowerCase();
  if (!text) {
    return false;
  }

  return !/(maybe|i think|possibly|not sure|perhaps|could be)/i.test(text);
}

function computeConfidence({ rawText, data, expectedFormat, schema }) {
  let confidence = 0;
  const nonEmpty = (typeof rawText === 'string' && rawText.trim().length > 0) || (data !== null && data !== undefined);
  if (nonEmpty) {
    confidence += 0.2;
  }

  let parsedValid = expectedFormat !== 'json';
  if (expectedFormat === 'json') {
    const parsed = typeof data === 'string' ? validateJSON(data) : { valid: true, data };
    parsedValid = parsed.valid;
    if (parsedValid) {
      confidence += 0.3;
      data = parsed.data;
    }
  }

  const schemaValid = schema ? validateSchema(data, schema).valid : parsedValid;
  if (schemaValid) {
    confidence += 0.3;
  }

  if (hasLowHallucinationIndicators(rawText)) {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

function classifyFailureReason(error, fallback = 'network_error') {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('parse') || message.includes('json')) {
    return 'parse_error';
  }
  if (message.includes('empty')) {
    return 'empty_response';
  }
  if (message.includes('confidence')) {
    return 'low_confidence';
  }
  return fallback;
}

function buildStructuredPrompt(prompt, expectedFormat, extraInstructions = '') {
  if (expectedFormat !== 'json') {
    return prompt;
  }

  return [
    extraInstructions,
    'Return strict JSON only. Do not include markdown fences or prose outside the JSON object.',
    prompt
  ].filter(Boolean).join('\n\n');
}

function createTaskSchema(taskType, metadata = {}) {
  if (metadata.schema) {
    return metadata.schema;
  }

  switch (taskType) {
    case 'query_expansion':
      return {
        type: 'object',
        required: ['intent', 'expanded_queries'],
        properties: {
          intent: { enum: ['build', 'buy', 'watch', 'mixed'] },
          expanded_queries: {
            type: 'array',
            items: {
              type: 'object',
              required: ['query'],
              properties: {
                query: 'string',
                target_source: 'string',
                reasoning: 'string'
              }
            }
          },
          safety_notes: 'string'
        }
      };
    case 'safety_filter':
      return {
        type: 'object',
        required: ['safe', 'category', 'riskScore'],
        properties: {
          safe: 'boolean',
          category: 'string',
          riskScore: 'number'
        }
      };
    case 'ranking':
      return {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'safety_score', 'relevance_score', 'educational_score', 'category'],
          properties: {
            id: 'string',
            safety_score: 'number',
            relevance_score: 'number',
            educational_score: 'number',
            category: 'string',
            summary: 'string'
          }
        }
      };
    default:
      return null;
  }
}

module.exports = {
  stripCodeFences,
  parseJSONResponse,
  validateJSON,
  computeConfidence,
  classifyFailureReason,
  buildStructuredPrompt,
  createTaskSchema
};