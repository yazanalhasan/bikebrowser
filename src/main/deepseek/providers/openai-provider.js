const axios = require('axios');
const {
  validateJSON,
  computeConfidence,
  classifyFailureReason,
  buildStructuredPrompt,
  createTaskSchema,
  stripCodeFences
} = require('../provider-utils');

class OpenAIProvider {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  getName() {
    return 'openai';
  }

  async healthCheck() {
    return Boolean(this.config?.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  buildMessages(prompt, taskType, expectedFormat) {
    if (taskType === 'query_expansion') {
      return [
        {
          role: 'system',
          content: 'You are a careful children\'s search assistant. Return strict JSON with intent, expanded_queries, safety_notes, and suggested_filters only.'
        },
        {
          role: 'user',
          content: buildStructuredPrompt(`Expand this search safely for a 9-year-old interested in bikes and maker projects: ${prompt}`, expectedFormat)
        }
      ];
    }

    if (taskType === 'ranking') {
      return [
        {
          role: 'system',
          content: 'You are a child-safe content evaluator. Return a JSON array only with id, safety_score, relevance_score, educational_score, category, and summary.'
        },
        {
          role: 'user',
          content: buildStructuredPrompt(typeof prompt === 'string' ? prompt : JSON.stringify(prompt), expectedFormat)
        }
      ];
    }

    if (taskType === 'safety_filter') {
      return [
        {
          role: 'system',
          content: 'You are a strict child-safety evaluator. Return JSON only with safe:boolean, category:string, riskScore:number.'
        },
        {
          role: 'user',
          content: buildStructuredPrompt(prompt, expectedFormat)
        }
      ];
    }

    return [
      {
        role: 'system',
        content: expectedFormat === 'json'
          ? 'You are a reliable assistant. Return strict JSON only and follow the requested schema exactly.'
          : 'You are a reliable assistant for bikes, maker projects, and child-safe explanations.'
      },
      {
        role: 'user',
        content: buildStructuredPrompt(prompt, expectedFormat)
      }
    ];
  }

  async generate({ prompt, taskType, expectedFormat, metadata = {} }) {
    const startedAt = Date.now();
    try {
      const schema = createTaskSchema(taskType, metadata);

      const response = await axios.post(this.baseUrl, {
        model: this.config.model,
        messages: this.buildMessages(prompt, taskType, expectedFormat),
        temperature: metadata.temperature ?? this.config.temperature ?? 0.2,
        max_tokens: metadata.maxTokens || 1800,
        response_format: expectedFormat === 'json' ? { type: 'json_object' } : undefined
      }, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });

      const rawText = response.data?.choices?.[0]?.message?.content || '';
      if (!rawText.trim()) {
        return {
          success: false,
          data: null,
          error: 'OpenAI returned an empty response',
          latency: Date.now() - startedAt,
          confidence: 0,
          provider: this.getName(),
          failureReason: 'empty_response'
        };
      }

      let data = stripCodeFences(rawText);
      if (expectedFormat === 'json') {
        const validation = validateJSON(data, schema);
        if (!validation.valid && taskType === 'ranking') {
          const relaxed = validateJSON(data);
          const candidate = relaxed.data?.items || relaxed.data?.results;
          const relaxedValidation = validateJSON(candidate, schema);
          if (relaxedValidation.valid) {
            data = relaxedValidation.data;
          } else {
            return {
              success: false,
              data: null,
              error: relaxedValidation.error || validation.error || 'Malformed JSON response from OpenAI',
              latency: Date.now() - startedAt,
              confidence: 0.2,
              provider: this.getName(),
              failureReason: 'parse_error'
            };
          }
        } else if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: validation.error || 'Malformed JSON response from OpenAI',
            latency: Date.now() - startedAt,
            confidence: 0.2,
            provider: this.getName(),
            failureReason: 'parse_error'
          };
        }
        if (validation.valid) {
          data = validation.data;
        }
      }

      return {
        success: true,
        data,
        error: null,
        latency: Date.now() - startedAt,
        confidence: computeConfidence({ rawText, data, expectedFormat, schema }),
        provider: this.getName()
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        latency: Date.now() - startedAt,
        confidence: 0,
        provider: this.getName(),
        failureReason: classifyFailureReason(error)
      };
    }
  }
}

module.exports = {
  OpenAIProvider
};