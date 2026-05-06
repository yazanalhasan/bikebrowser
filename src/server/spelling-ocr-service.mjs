const DEFAULT_TIMEOUT_MS = 25000;

const SPELLING_OCR_PROMPT = `Read this spelling worksheet image and extract only the spelling words.
Return strict JSON only:
{
  "rawText": "all useful text you can read",
  "words": ["word1", "word2"],
  "confidence": "high" | "medium" | "low"
}
Keep the original word order. Ignore directions, names, dates, page labels, and sentence-writing prompts.`;

function stripCodeFences(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function normalizeWord(word) {
  return String(word || '').toLowerCase().replace(/[^a-z]/g, '').trim();
}

function uniqueWords(words) {
  return [...new Set(
    (words || [])
      .map(normalizeWord)
      .filter((word) => word.length >= 3 && word.length <= 18)
  )];
}

function wordsFromText(text) {
  const candidates = String(text || '')
    .split(/\r?\n|,|;|\t|\d+\./g)
    .flatMap((line) => line.split(/\s+/))
    .map(normalizeWord)
    .filter((word) => ![
      'spelling',
      'words',
      'word',
      'directions',
      'instructions',
      'worksheet',
      'name',
      'date',
      'sentence',
      'sentences',
      'write',
      'trace',
      'circle',
      'complete',
      'challenge',
      'content'
    ].includes(word));

  return uniqueWords(candidates);
}

function parseProviderPayload(payload) {
  if (payload && typeof payload === 'object') {
    return payload;
  }

  const text = stripCodeFences(payload);
  if (!text) {
    return { rawText: '', words: [] };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text, words: wordsFromText(text) };
  }
}

export function normalizeSpellingOcrResponse(provider, payload) {
  const parsed = parseProviderPayload(payload);
  const rawText = String(parsed.rawText || parsed.text || parsed.transcript || '');
  const fallbackText = typeof payload === 'string' ? payload : '';
  const words = uniqueWords(
    Array.isArray(parsed.words) && parsed.words.length
      ? parsed.words
      : wordsFromText(rawText || fallbackText)
  );

  return {
    success: words.length > 0,
    provider,
    rawText: rawText || words.join('\n'),
    words,
    confidence: parsed.confidence || (words.length >= 8 ? 'medium' : 'low'),
    fallbackRequired: words.length === 0
  };
}

function withTimeout(promise, timeoutMs, providerName) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${providerName} timed out`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function createSpellingOcrService({ providers = [], timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return {
    async recognizeWorksheet({ imageDataUrl, fileName = 'worksheet' } = {}) {
      if (!imageDataUrl || !String(imageDataUrl).startsWith('data:image/')) {
        return {
          success: false,
          provider: null,
          rawText: '',
          words: [],
          confidence: 'low',
          fallbackRequired: true,
          errors: [{ provider: 'request', error: 'Provide a PNG, JPEG, WEBP, or GIF worksheet image.' }]
        };
      }

      const errors = [];

      for (const provider of providers.filter(Boolean)) {
        try {
          const payload = await withTimeout(
            provider.run({ prompt: SPELLING_OCR_PROMPT, imageDataUrl, fileName }),
            provider.timeoutMs || timeoutMs,
            provider.name
          );
          const normalized = normalizeSpellingOcrResponse(provider.name, payload);
          if (normalized.success) {
            return {
              ...normalized,
              fallbackRequired: false,
              errors
            };
          }
          errors.push({ provider: provider.name, error: 'No spelling words found.' });
        } catch (error) {
          errors.push({ provider: provider.name, error: error.message || String(error) });
        }
      }

      return {
        success: false,
        provider: null,
        rawText: '',
        words: [],
        confidence: 'low',
        fallbackRequired: true,
        errors
      };
    }
  };
}

export function createOpenAiCompatibleVisionProvider({
  name,
  apiKey,
  endpoint,
  model,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
  if (!apiKey || !endpoint || !model) {
    return null;
  }

  return {
    name,
    timeoutMs,
    async run({ prompt, imageDataUrl }) {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageDataUrl } }
              ]
            }
          ]
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.error?.message || body?.message || `${name} returned HTTP ${response.status}`;
        throw new Error(message);
      }

      return body?.choices?.[0]?.message?.content || '';
    }
  };
}

export function buildDefaultSpellingOcrProviders(env = {}, fetchImpl = fetch) {
  const timeoutMs = Number(env.SPELLING_OCR_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  return [
    createOpenAiCompatibleVisionProvider({
      name: 'thaura',
      apiKey: env.THAURA_API_KEY || env.THURA_API_KEY,
      endpoint: env.THAURA_API_URL || 'https://api.thaura.ai/v1/chat/completions',
      model: env.THAURA_VISION_MODEL || env.THAURA_MODEL || env.THURA_MODEL || 'thaura-3-default',
      fetchImpl,
      timeoutMs
    }),
    createOpenAiCompatibleVisionProvider({
      name: 'deepseek',
      apiKey: env.DEEPSEEK_API_KEY,
      endpoint: env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
      model: env.DEEPSEEK_VISION_MODEL || env.DEEPSEEK_MODEL || 'deepseek-chat',
      fetchImpl,
      timeoutMs
    }),
    createOpenAiCompatibleVisionProvider({
      name: 'openai',
      apiKey: env.OPENAI_API_KEY,
      endpoint: env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
      model: env.OPENAI_VISION_MODEL || env.OPENAI_MODEL || 'gpt-4.1-mini',
      fetchImpl,
      timeoutMs
    })
  ].filter(Boolean);
}
