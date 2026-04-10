const {
  validateJSON,
  computeConfidence,
  classifyFailureReason,
  buildStructuredPrompt,
  createTaskSchema,
  stripCodeFences
} = require('../provider-utils');

class DeepSeekProvider {
  constructor(client, config) {
    this.client = client;
    this.config = config;
  }

  getName() {
    return 'deepseek';
  }

  async healthCheck() {
    return Boolean(this.config?.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  buildMessages(prompt, taskType, expectedFormat) {
    if (taskType === 'query_expansion') {
      return [
        { role: 'system', content: this.client.promptTemplates.getSystemPrompt('query_expander') },
        { role: 'user', content: this.client.promptTemplates.buildQueryExpansionPrompt(prompt) }
      ];
    }

    if (taskType === 'ranking') {
      return [
        { role: 'system', content: this.client.promptTemplates.getSystemPrompt('content_evaluator') },
        { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
      ];
    }

    if (taskType === 'safety_filter') {
      return [
        {
          role: 'system',
          content: 'You are a strict child-safety evaluator. Return JSON only with fields safe:boolean, category:string, riskScore:number.'
        },
        {
          role: 'user',
          content: buildStructuredPrompt(prompt, expectedFormat, 'Assess whether this content is safe for a child interested in bikes and maker projects.')
        }
      ];
    }

    return [
      {
        role: 'system',
        content: expectedFormat === 'json'
          ? 'You are a careful assistant. Return strict JSON only.'
          : 'You are a careful assistant for bike and maker learning.'
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
      const messages = this.buildMessages(prompt, taskType, expectedFormat);
      const response = await this.client.callAPI(messages, {
        temperature: metadata.temperature ?? (taskType === 'query_expansion' ? 0.3 : 0.2),
        maxTokens: metadata.maxTokens || this.config.maxTokens,
        responseFormat: expectedFormat === 'json' ? { type: 'json_object' } : undefined
      });

      const rawText = response.choices?.[0]?.message?.content || '';
      if (!rawText.trim()) {
        return {
          success: false,
          data: null,
          error: 'DeepSeek returned an empty response',
          latency: Date.now() - startedAt,
          confidence: 0,
          provider: this.getName(),
          failureReason: 'empty_response'
        };
      }

      let data = stripCodeFences(rawText);
      const schema = createTaskSchema(taskType, metadata);
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
              error: relaxedValidation.error || validation.error || 'Malformed JSON response from DeepSeek',
              latency: Date.now() - startedAt,
              confidence: 0.25,
              provider: this.getName(),
              failureReason: 'parse_error'
            };
          }
        } else if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: validation.error || 'Malformed JSON response from DeepSeek',
            latency: Date.now() - startedAt,
            confidence: 0.25,
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
  DeepSeekProvider
};