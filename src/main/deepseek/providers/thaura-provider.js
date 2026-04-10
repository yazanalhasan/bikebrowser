const thauraService = require('../../services/thauraService');
const {
  validateJSON,
  computeConfidence,
  classifyFailureReason,
  buildStructuredPrompt,
  createTaskSchema,
  stripCodeFences
} = require('../provider-utils');

class ThauraProvider {
  constructor(config) {
    this.config = config;
  }

  getName() {
    return 'thaura';
  }

  async healthCheck() {
    return Boolean(this.config?.apiKey);
  }

  async generate({ prompt, taskType, expectedFormat, metadata = {} }) {
    const startedAt = Date.now();
    try {
      const strictInstruction = expectedFormat === 'json'
        ? 'Return strict JSON only. If you cannot comply, return a single valid JSON object with an error field.'
        : '';
      const finalPrompt = buildStructuredPrompt(prompt, expectedFormat, [
        strictInstruction,
        taskType === 'safety_filter'
          ? 'Assess child safety and return JSON with safe, category, and riskScore.'
          : 'Prefer concise, structured output.'
      ].filter(Boolean).join('\n'));

      const response = await thauraService.thauraSearch(finalPrompt, {
        model: this.config.model === 'default' ? undefined : this.config.model,
        temperature: metadata.temperature ?? 0.2,
        maxTokens: metadata.maxTokens || 1800,
        timeout: this.config.timeout
      });

      const rawText = response.choices?.[0]?.message?.content || '';
      if (!rawText.trim()) {
        return {
          success: false,
          data: null,
          error: 'Thaura returned an empty response',
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
              error: relaxedValidation.error || validation.error || 'Malformed JSON response from Thaura',
              latency: Date.now() - startedAt,
              confidence: 0.1,
              provider: this.getName(),
              failureReason: 'parse_error'
            };
          }
        } else if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: validation.error || 'Malformed JSON response from Thaura',
            latency: Date.now() - startedAt,
            confidence: 0.1,
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
  ThauraProvider
};