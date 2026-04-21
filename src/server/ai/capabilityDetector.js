/**
 * Capability Detector — runtime hardware and AI inference capability detection.
 *
 * Detects:
 *   - CPU info (cores, model)
 *   - GPU presence and type
 *   - Local AI inference runtime availability (Ollama, llama.cpp, LM Studio)
 *   - Local inference health status
 *   - Recommended routing per task category
 *
 * Results are cached after first probe to avoid repeated overhead.
 */

const os = require('os');
const { execSync } = require('child_process');
const http = require('http');

// ── Known local inference endpoints ──────────────────────────────────────────

const LOCAL_ENDPOINTS = [
  {
    name: 'ollama',
    baseUrl: 'http://localhost:11434',
    healthPath: '/api/tags',
    modelsPath: '/api/tags',
    apiStyle: 'ollama',
  },
  {
    name: 'lmstudio',
    baseUrl: 'http://localhost:1234',
    healthPath: '/v1/models',
    modelsPath: '/v1/models',
    apiStyle: 'openai-compatible',
  },
  {
    name: 'llamacpp',
    baseUrl: 'http://localhost:8080',
    healthPath: '/health',
    modelsPath: '/v1/models',
    apiStyle: 'openai-compatible',
  },
];

// Allow custom endpoint via env
function getCustomEndpoint() {
  const url = process.env.LOCAL_AI_ENDPOINT;
  if (!url) return null;
  return {
    name: 'custom',
    baseUrl: url.replace(/\/+$/, ''),
    healthPath: '/v1/models',
    modelsPath: '/v1/models',
    apiStyle: process.env.LOCAL_AI_API_STYLE || 'openai-compatible',
  };
}

// ── Probing helpers ──────────────────────────────────────────────────────────

function httpGet(url, timeoutMs = 2000) {
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

function detectGpu() {
  const platform = os.platform();
  const result = { name: null, vendor: null, vramMb: null, driver: null, inferenceCapable: false };

  try {
    if (platform === 'win32') {
      const raw = execSync(
        'wmic path win32_VideoController get Name,AdapterRAM,DriverVersion /format:csv',
        { timeout: 5000, encoding: 'utf8' }
      );
      const lines = raw.split('\n').filter((l) => l.trim() && !l.startsWith('Node'));
      for (const line of lines) {
        const parts = line.split(',').map((s) => s.trim());
        // CSV format: Node,AdapterRAM,DriverVersion,Name
        const [, adapterRam, driver, name] = parts;
        if (!name || name.toLowerCase().includes('virtual') || name.toLowerCase().includes('basic')) continue;
        result.name = name;
        result.driver = driver;
        result.vramMb = adapterRam ? Math.round(parseInt(adapterRam) / 1048576) : null;
        result.vendor = name.toLowerCase().includes('nvidia') ? 'nvidia'
          : name.toLowerCase().includes('amd') || name.toLowerCase().includes('radeon') ? 'amd'
          : name.toLowerCase().includes('intel') ? 'intel'
          : 'unknown';
        result.inferenceCapable = (result.vramMb || 0) >= 2048; // 2GB+ minimum
        break;
      }
    } else if (platform === 'linux') {
      try {
        const nvOut = execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits', { timeout: 5000, encoding: 'utf8' });
        const [name, vram] = nvOut.trim().split(',').map((s) => s.trim());
        result.name = name;
        result.vendor = 'nvidia';
        result.vramMb = parseInt(vram);
        result.inferenceCapable = (result.vramMb || 0) >= 2048;
      } catch {
        // Try lspci
        try {
          const lspci = execSync('lspci | grep -i vga', { timeout: 5000, encoding: 'utf8' });
          const match = lspci.match(/:\s*(.+)/);
          if (match) {
            result.name = match[1].trim();
            result.vendor = result.name.toLowerCase().includes('nvidia') ? 'nvidia' : 'amd';
          }
        } catch { /* no GPU info */ }
      }
    } else if (platform === 'darwin') {
      try {
        const spOut = execSync('system_profiler SPDisplaysDataType', { timeout: 5000, encoding: 'utf8' });
        const nameMatch = spOut.match(/Chipset Model:\s*(.+)/);
        if (nameMatch) {
          result.name = nameMatch[1].trim();
          result.vendor = result.name.toLowerCase().includes('apple') ? 'apple' : 'unknown';
          result.inferenceCapable = result.vendor === 'apple'; // Apple Silicon unified memory
        }
      } catch { /* no GPU info */ }
    }
  } catch { /* GPU detection failed, non-critical */ }

  return result;
}

// ── Main Capability Detector ─────────────────────────────────────────────────

let _cachedCapabilities = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60000; // re-probe every 60s

/**
 * Detect current machine capabilities.
 * Results are cached for 60 seconds.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<object>} capability report
 */
async function detectCapabilities(forceRefresh = false) {
  if (!forceRefresh && _cachedCapabilities && (Date.now() - _cacheTimestamp < CACHE_TTL)) {
    return _cachedCapabilities;
  }

  const cpus = os.cpus();
  const cpu = {
    model: cpus[0]?.model || 'unknown',
    cores: cpus.length,
    physicalCores: new Set(cpus.map((c) => c.model)).size > 1 ? cpus.length : Math.ceil(cpus.length / 2),
    arch: os.arch(),
  };

  const memory = {
    totalMb: Math.round(os.totalmem() / 1048576),
    freeMb: Math.round(os.freemem() / 1048576),
  };

  const gpu = detectGpu();

  // Probe local inference endpoints
  const endpoints = [...LOCAL_ENDPOINTS];
  const custom = getCustomEndpoint();
  if (custom) endpoints.unshift(custom);

  let localInference = {
    available: false,
    healthy: false,
    endpoint: null,
    runtime: null,
    apiStyle: null,
    models: [],
    latencyMs: null,
  };

  // Try each endpoint with a retry — local runtimes like LM Studio may
  // take a few seconds to finish loading models after process start.
  for (const ep of endpoints) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const start = Date.now();
        const res = await httpGet(`${ep.baseUrl}${ep.healthPath}`, 3000);
        const latency = Date.now() - start;

        if (res.status === 200) {
          // Extract model list
          let models = [];
          if (ep.apiStyle === 'ollama' && res.data?.models) {
            models = res.data.models.map((m) => m.name || m.model);
          } else if (res.data?.data) {
            models = res.data.data.map((m) => m.id || m.name);
          }

          localInference = {
            available: true,
            healthy: true,
            endpoint: ep.baseUrl,
            runtime: ep.name,
            apiStyle: ep.apiStyle,
            models,
            latencyMs: latency,
          };
          console.log(`[Capabilities] Local inference found: ${ep.name} at ${ep.baseUrl} (${models.length} models, ${latency}ms)`);
          break;
        }
      } catch {
        // First attempt failed — wait 2s and retry once
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
    if (localInference.available) break;
  }

  // Compute preferred routes
  const preferredRoutes = computePreferredRoutes(gpu, localInference);

  _cachedCapabilities = {
    timestamp: Date.now(),
    platform: os.platform(),
    cpu,
    memory,
    gpu,
    localInference,
    webglRendering: true, // Electron always supports WebGL
    preferredRoutes,
  };
  _cacheTimestamp = Date.now();

  return _cachedCapabilities;
}

/**
 * Compute preferred execution routes based on detected capabilities.
 */
function computePreferredRoutes(gpu, localInference) {
  const hasLocalGpu = gpu.inferenceCapable;
  const hasLocalInference = localInference.available && localInference.healthy;
  const localFast = hasLocalInference && (localInference.latencyMs || 9999) < 500;

  return {
    npcDialogue: hasLocalInference && localFast ? 'local-gpu'
      : hasLocalInference ? 'local-gpu'
      : 'remote',
    questionGeneration: hasLocalInference && localFast ? 'local-gpu' : 'remote',
    explanationGeneration: hasLocalInference ? 'local-gpu' : 'remote',
    hintGeneration: hasLocalInference && localFast ? 'local-gpu' : 'remote',
    safetyFilter: 'remote', // Always prefer remote for safety
    structuredParsing: hasLocalInference ? 'local-gpu' : 'remote',
    fallbackDialogue: 'cpu-template',
    questLogic: 'cpu-deterministic',
    speechSynthesis: 'browser-platform',
    gameRendering: 'webgl',
  };
}

/**
 * Quick check: is local inference available right now?
 * Uses cached result, doesn't re-probe.
 */
function isLocalInferenceAvailable() {
  return _cachedCapabilities?.localInference?.available || false;
}

/**
 * Get a concise summary for logging/diagnostics.
 */
function getCapabilitySummary() {
  if (!_cachedCapabilities) return 'Not yet detected';
  const c = _cachedCapabilities;
  return {
    cpu: `${c.cpu.model} (${c.cpu.cores} threads)`,
    gpu: c.gpu.name || 'none',
    gpuVram: c.gpu.vramMb ? `${c.gpu.vramMb}MB` : 'n/a',
    ram: `${c.memory.totalMb}MB total, ${c.memory.freeMb}MB free`,
    localInference: c.localInference.available
      ? `${c.localInference.runtime} at ${c.localInference.endpoint} (${c.localInference.models.length} models, ${c.localInference.latencyMs}ms)`
      : 'unavailable',
    preferredDialogueRoute: c.preferredRoutes.npcDialogue,
  };
}

module.exports = {
  detectCapabilities,
  isLocalInferenceAvailable,
  getCapabilitySummary,
  LOCAL_ENDPOINTS,
};
