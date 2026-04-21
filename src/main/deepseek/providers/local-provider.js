/**
 * Local AI Provider — adapter for local inference runtimes.
 *
 * Supports OpenAI-compatible API endpoints (llama.cpp server, LM Studio,
 * Ollama with OpenAI compatibility, or any local server on the same API).
 *
 * Targets:
 *   - Ollama: http://localhost:11434 (native API + OpenAI compat at /v1)
 *   - LM Studio: http://localhost:1234 (OpenAI-compatible)
 *   - llama.cpp server: http://localhost:8080 (OpenAI-compatible)
 *   - Custom: env LOCAL_AI_ENDPOINT
 *
 * The provider is optional — if no local runtime is available, it fails
 * health checks and the provider manager skips it naturally.
 *
 * GPU note for this machine (AMD RX 580 2048SP, ~4GB VRAM):
 *   - CUDA: not available (AMD GPU)
 *   - ROCm: limited support for GCN (Polaris) — not recommended
 *   - Vulkan: supported by llama.cpp — best path for this GPU
 *   - Realistic models: Q4_K_M quantized 7B models (Mistral, Llama 3.1, Phi-3)
 *   - Expected speed: ~10-15 tokens/sec with Vulkan on RX 580
 */

const http = require('http');
const axios = require('axios');
const {
  validateJSON,
  computeConfidence,
  buildStructuredPrompt,
  createTaskSchema,
  stripCodeFences,
} = require('../provider-utils');

class LocalProvider {
  constructor(config) {
    this.config = config || {};
    this.endpoint = this.config.endpoint || process.env.LOCAL_AI_ENDPOINT || null;
    this.model = this.config.model || process.env.LOCAL_AI_MODEL || 'default';
    this.timeout = this.config.timeout || parseInt(process.env.LOCAL_AI_TIMEOUT || '15000');
    this.apiStyle = this.config.apiStyle || process.env.LOCAL_AI_API_STYLE || 'openai-compatible';

    // Auto-detect endpoint if not explicitly set
    if (!this.endpoint) {
      this._autoDetectEndpoint();
    }
  }

  getName() {
    return 'local';
  }

  async healthCheck() {
    if (!this.endpoint) {
      // Try auto-detection on health check
      await this._autoDetectEndpoint();
    }
    if (!this.endpoint) return false;

    try {
      const res = await this._httpGet(`${this.endpoint}/v1/models`, 2000);
      return res.status === 200;
    } catch {
      // Try Ollama native endpoint
      try {
        const res = await this._httpGet(`${this.endpoint}/api/tags`, 2000);
        if (res.status === 200) {
          this.apiStyle = 'ollama';
          return true;
        }
      } catch { /* not available */ }
      return false;
    }
  }

  async generate({ prompt, taskType, expectedFormat, metadata = {} }) {
    const startedAt = Date.now();

    if (!this.endpoint) {
      return this._fail('No local inference endpoint configured', startedAt, 'no_endpoint');
    }

    try {
      const messages = this._buildMessages(prompt, taskType, expectedFormat);
      const body = {
        model: this.model,
        messages,
        temperature: metadata.temperature ?? this.config.temperature ?? 0.3,
        max_tokens: metadata.maxTokens || 1024,
        stream: false,
      };

      // Don't set response_format — not all local runtimes support it.
      // JSON output is enforced via system prompt instead.

      let response;
      if (this.apiStyle === 'ollama') {
        response = await this._ollamaGenerate(prompt, expectedFormat, metadata);
      } else {
        response = await this._openaiCompatGenerate(body);
      }

      const rawText = response || '';
      if (!rawText.trim()) {
        return this._fail('Local inference returned empty response', startedAt, 'empty_response');
      }

      let data = stripCodeFences(rawText);
      if (expectedFormat === 'json') {
        const schema = createTaskSchema(taskType, metadata);
        const validation = validateJSON(data, schema);
        if (!validation.valid) {
          return this._fail(
            validation.error || 'Malformed JSON from local inference',
            startedAt,
            'parse_error'
          );
        }
        data = validation.data;
      }

      return {
        success: true,
        data,
        error: null,
        latency: Date.now() - startedAt,
        confidence: computeConfidence({ rawText, data, expectedFormat }),
        provider: this.getName(),
      };
    } catch (error) {
      return this._fail(error.message, startedAt, this._classifyError(error));
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  _buildMessages(prompt, taskType, expectedFormat) {
    const systemPrompt = expectedFormat === 'json'
      ? 'You are a helpful assistant for a children\'s bike learning game. Return strict JSON only. Be child-friendly, concise, and educational.'
      : 'You are a helpful assistant for a children\'s bike learning game. Be child-friendly, concise, and educational.';

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildStructuredPrompt(typeof prompt === 'string' ? prompt : JSON.stringify(prompt), expectedFormat) },
    ];
  }

  async _openaiCompatGenerate(body) {
    const url = `${this.endpoint}/v1/chat/completions`;

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: this.timeout,
    });

    return response.data?.choices?.[0]?.message?.content || '';
  }

  async _ollamaGenerate(prompt, expectedFormat, metadata) {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: this.model,
      prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
      stream: false,
      options: {
        temperature: metadata.temperature ?? 0.3,
        num_predict: metadata.maxTokens || 1024,
      },
    };

    if (expectedFormat === 'json') {
      body.format = 'json';
    }

    const payload = JSON.stringify(body);

    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: this.timeout,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json?.response || '');
          } catch {
            reject(new Error(`Invalid response from Ollama: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Ollama timeout')); });
      req.write(payload);
      req.end();
    });
  }

  async _autoDetectEndpoint() {
    const candidates = [
      { url: 'http://localhost:11434', check: '/api/tags', style: 'ollama' },
      { url: 'http://localhost:1234', check: '/v1/models', style: 'openai-compatible' },
      { url: 'http://localhost:8080', check: '/health', style: 'openai-compatible' },
    ];

    for (const c of candidates) {
      try {
        const res = await this._httpGet(`${c.url}${c.check}`, 1500);
        if (res.status === 200) {
          this.endpoint = c.url;
          this.apiStyle = c.style;
          console.log(`[LocalProvider] Auto-detected: ${c.style} at ${c.url}`);

          // Try to pick a model
          if (c.style === 'ollama' && res.data?.models?.length > 0) {
            this.model = res.data.models[0].name;
          } else if (res.data?.data?.length > 0) {
            this.model = res.data.data[0].id;
          }
          return;
        }
      } catch { /* try next */ }
    }
  }

  _httpGet(url, timeoutMs) {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data: null });
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
  }

  _fail(error, startedAt, reason) {
    return {
      success: false,
      data: null,
      error,
      latency: Date.now() - startedAt,
      confidence: 0,
      provider: this.getName(),
      failureReason: reason,
    };
  }

  _classifyError(error) {
    const msg = error.message || '';
    if (msg.includes('timeout')) return 'timeout';
    if (msg.includes('ECONNREFUSED')) return 'not_running';
    if (msg.includes('ECONNRESET')) return 'network_error';
    return 'unknown_error';
  }
}

module.exports = { LocalProvider };
