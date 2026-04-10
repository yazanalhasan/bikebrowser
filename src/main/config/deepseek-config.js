const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
}

function readFirstEnv(names, fallback = '') {
  for (const name of names) {
    const value = readEnv(name);
    if (value) {
      return value;
    }
  }

  return fallback;
}

function readInt(name, fallback) {
  const parsed = Number.parseInt(readEnv(name, `${fallback}`), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readFloat(name, fallback) {
  const parsed = Number.parseFloat(readEnv(name, `${fallback}`));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validateApiKey(value, prefix) {
  if (!value) {
    return false;
  }

  if (!prefix) {
    return true;
  }

  return value.startsWith(prefix);
}

const deepseekConfig = {
  apiKey: readEnv('DEEPSEEK_API_KEY'),
  model: readEnv('DEEPSEEK_MODEL', 'deepseek-chat'),
  maxTokens: readInt('DEEPSEEK_MAX_TOKENS', 4096),
  temperature: readFloat('DEEPSEEK_TEMPERATURE', 0.3),
  timeout: readInt('DEEPSEEK_TIMEOUT', 30000),
  batchSize: readInt('DEEPSEEK_BATCH_SIZE', 20),
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
    maxConcurrent: 5
  },
  cache: {
    enabled: true,
    ttl: readInt('DEEPSEEK_CACHE_TTL', 86400),
    maxSize: 1000
  },
  safety: {
    minimumSafetyScore: 0.6,
    minimumRelevanceScore: 0.4,
    requireParentalGate: 0.3
  },
  providers: {
    deepseek: {
      apiKey: readEnv('DEEPSEEK_API_KEY'),
      model: readEnv('DEEPSEEK_MODEL', 'deepseek-chat'),
      timeout: readInt('DEEPSEEK_TIMEOUT', 30000),
      temperature: readFloat('DEEPSEEK_TEMPERATURE', 0.3),
      valid: validateApiKey(readEnv('DEEPSEEK_API_KEY'), 'sk-')
    },
    openai: {
      apiKey: readEnv('OPENAI_API_KEY'),
      model: readEnv('OPENAI_MODEL', 'gpt-4o-mini'),
      timeout: readInt('OPENAI_TIMEOUT', 30000),
      temperature: 0.2,
      valid: validateApiKey(readEnv('OPENAI_API_KEY'), 'sk-')
    },
    thaura: {
      apiKey: readFirstEnv(['THAURA_API_KEY', 'THURA_API_KEY']),
      model: readFirstEnv(['THAURA_MODEL', 'THURA_MODEL'], 'default'),
      timeout: readInt('THAURA_TIMEOUT', readInt('THURA_TIMEOUT', 30000)),
      temperature: 0.2,
      valid: Boolean(readFirstEnv(['THAURA_API_KEY', 'THURA_API_KEY']))
    }
  },
  orchestration: {
    confidenceThreshold: 0.6,
    healthFailureThreshold: 2,
    healthCooldownMs: 60000
  }
};

function getAIProviderStatus() {
  return {
    hasDeepSeek: deepseekConfig.providers.deepseek.valid,
    hasOpenAI: deepseekConfig.providers.openai.valid,
    hasThaura: deepseekConfig.providers.thaura.valid,
    hasFallback: true,
    validation: {
      deepseek: deepseekConfig.providers.deepseek.valid,
      openai: deepseekConfig.providers.openai.valid,
      thaura: deepseekConfig.providers.thaura.valid
    }
  };
}

module.exports = {
  deepseekConfig,
  getAIProviderStatus
};