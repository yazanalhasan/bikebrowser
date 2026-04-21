/**
 * Compute Orchestrator — resource-aware AI task routing.
 *
 * Receives structured task requests, classifies them, inspects machine
 * capabilities, and routes to the appropriate execution path:
 *   - CPU (deterministic/control-plane)
 *   - Local GPU inference (when available)
 *   - Remote provider (existing cloud AI stack)
 *   - Fallback (deterministic templates)
 *
 * Integrates with the existing ProviderManager — does not replace it.
 * The orchestrator sits *above* the provider manager and adds resource-
 * awareness to the routing decision.
 */

const { WorkloadClass, getTaskClassification, classifyProviderTask } = require('./workloadClasses');
const { detectCapabilities, isLocalInferenceAvailable } = require('./capabilityDetector');

// ── Resource Policy ──────────────────────────────────────────────────────────

const RESOURCE_POLICIES = {
  adaptive: 'adaptive',       // Use best available resource per task
  'prefer-local': 'prefer-local', // Prefer local GPU when available
  'prefer-remote': 'prefer-remote', // Prefer remote providers
  'cpu-safe': 'cpu-safe',     // CPU-only, no AI inference
};

let _policy = process.env.RESOURCE_POLICY || 'adaptive';

function setResourcePolicy(policy) {
  if (RESOURCE_POLICIES[policy]) {
    _policy = policy;
    console.log(`[ComputeOrchestrator] Resource policy set to: ${policy}`);
  }
}

function getResourcePolicy() {
  return _policy;
}

// ── Routing Decision ─────────────────────────────────────────────────────────

/**
 * Decide where a task should execute.
 *
 * @param {object} taskRequest
 * @param {string} taskRequest.taskType - workload task type or provider task type
 * @param {number} [taskRequest.latencyBudgetMs] - max acceptable latency
 * @param {boolean} [taskRequest.allowLocalGpu=true]
 * @param {boolean} [taskRequest.allowRemote=true]
 * @param {boolean} [taskRequest.allowFallback=true]
 * @param {string} [taskRequest.preferredProvider]
 * @param {object} [taskRequest.metadata]
 * @param {object} capabilities - from detectCapabilities()
 * @returns {{ route: string, provider: string|null, reason: string }}
 */
function decideRoute(taskRequest, capabilities) {
  const {
    taskType,
    latencyBudgetMs,
    allowLocalGpu = true,
    allowRemote = true,
    allowFallback = true,
    metadata = {},
  } = taskRequest;

  // Classify the task
  const workloadType = classifyProviderTask(taskType, metadata);
  const classification = getTaskClassification(workloadType) || getTaskClassification(taskType);

  // Deterministic tasks always stay CPU
  if (classification?.requiresDeterministic) {
    return {
      route: 'cpu-deterministic',
      provider: null,
      reason: `Task "${taskType}" is deterministic — always CPU`,
      workloadClass: WorkloadClass.CPU_CONTROL,
    };
  }

  // CPU_CONTROL and CPU_REALTIME always stay local
  if (classification?.primaryClass === WorkloadClass.CPU_CONTROL ||
      classification?.primaryClass === WorkloadClass.CPU_REALTIME) {
    return {
      route: 'cpu-local',
      provider: null,
      reason: `Task class ${classification.primaryClass} — CPU only`,
      workloadClass: classification.primaryClass,
    };
  }

  // Browser platform tasks
  if (classification?.primaryClass === WorkloadClass.BROWSER_PLATFORM) {
    return {
      route: 'browser-platform',
      provider: null,
      reason: 'Browser/OS managed service',
      workloadClass: WorkloadClass.BROWSER_PLATFORM,
    };
  }

  // Apply resource policy
  if (_policy === 'cpu-safe') {
    return {
      route: 'cpu-fallback',
      provider: null,
      reason: 'Resource policy: cpu-safe — no AI inference',
      workloadClass: WorkloadClass.CPU_CONTROL,
    };
  }

  const localAvail = capabilities?.localInference?.available && allowLocalGpu;
  const localHealthy = capabilities?.localInference?.healthy;
  const localLatency = capabilities?.localInference?.latencyMs || 9999;
  const budget = latencyBudgetMs || classification?.maxLatencyMs || 8000;

  // GPU_LOCAL_INTERACTIVE or GPU_LOCAL_BATCH tasks
  if (classification?.primaryClass === WorkloadClass.GPU_LOCAL_INTERACTIVE ||
      classification?.primaryClass === WorkloadClass.GPU_LOCAL_BATCH) {

    // Try local GPU first
    if (_policy === 'prefer-local' || _policy === 'adaptive') {
      if (localAvail && localHealthy && localLatency < budget) {
        return {
          route: 'local-gpu',
          provider: 'local',
          reason: `Local inference available (${capabilities.localInference.runtime}, ${localLatency}ms latency)`,
          workloadClass: classification.primaryClass,
        };
      }
    }

    // Fall through to remote
    if (allowRemote && _policy !== 'prefer-local') {
      return {
        route: 'remote-provider',
        provider: metadata?.preferredProvider || null,
        reason: localAvail
          ? `Local inference available but ${_policy === 'prefer-remote' ? 'policy prefers remote' : 'latency exceeds budget'}`
          : 'Local inference unavailable — using remote provider',
        workloadClass: WorkloadClass.REMOTE_PROVIDER,
      };
    }

    // If prefer-local but local unavailable, still try remote
    if (allowRemote) {
      return {
        route: 'remote-provider',
        provider: metadata?.preferredProvider || null,
        reason: 'Local inference unavailable — falling back to remote',
        workloadClass: WorkloadClass.REMOTE_PROVIDER,
      };
    }

    // All inference unavailable — CPU fallback
    if (allowFallback) {
      return {
        route: 'cpu-fallback',
        provider: null,
        reason: 'No inference available — using deterministic fallback',
        workloadClass: WorkloadClass.CPU_CONTROL,
      };
    }
  }

  // REMOTE_PROVIDER tasks
  if (classification?.primaryClass === WorkloadClass.REMOTE_PROVIDER) {
    // In prefer-local mode, try local first for remote-classified tasks too
    if (_policy === 'prefer-local' && localAvail && localHealthy) {
      return {
        route: 'local-gpu',
        provider: 'local',
        reason: 'Policy prefers local — routing remote-class task to local GPU',
        workloadClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
      };
    }

    if (allowRemote) {
      return {
        route: 'remote-provider',
        provider: metadata?.preferredProvider || null,
        reason: 'Remote provider task',
        workloadClass: WorkloadClass.REMOTE_PROVIDER,
      };
    }

    // Remote not allowed — try local
    if (localAvail && localHealthy) {
      return {
        route: 'local-gpu',
        provider: 'local',
        reason: 'Remote not allowed — using local GPU',
        workloadClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
      };
    }

    if (allowFallback) {
      return {
        route: 'cpu-fallback',
        provider: null,
        reason: 'No remote or local inference — CPU fallback',
        workloadClass: WorkloadClass.CPU_CONTROL,
      };
    }
  }

  // Default: remote if allowed, else fallback
  if (allowRemote) {
    return {
      route: 'remote-provider',
      provider: null,
      reason: 'Default route — remote provider',
      workloadClass: WorkloadClass.REMOTE_PROVIDER,
    };
  }

  return {
    route: 'cpu-fallback',
    provider: null,
    reason: 'No route available — CPU fallback',
    workloadClass: WorkloadClass.CPU_CONTROL,
  };
}

// ── Orchestration Entry Point ────────────────────────────────────────────────

/**
 * Route and execute a task through the appropriate compute path.
 *
 * This wraps the existing ProviderManager and adds resource-awareness.
 * When local inference is chosen, it calls the local provider directly.
 * When remote is chosen, it delegates to ProviderManager as before.
 *
 * @param {object} taskRequest - task parameters
 * @param {object} providerManager - existing ProviderManager instance
 * @returns {Promise<object>} result with routing metadata
 */
async function orchestrateTask(taskRequest, providerManager) {
  const startTime = Date.now();
  const capabilities = await detectCapabilities();
  const routeDecision = decideRoute(taskRequest, capabilities);

  const diagnostic = {
    taskType: taskRequest.taskType,
    route: routeDecision.route,
    provider: routeDecision.provider,
    reason: routeDecision.reason,
    workloadClass: routeDecision.workloadClass,
    policy: _policy,
    localInferenceAvailable: capabilities.localInference.available,
    timestamp: Date.now(),
  };

  try {
    let result;

    switch (routeDecision.route) {
      case 'cpu-deterministic':
      case 'cpu-local':
      case 'cpu-fallback':
        // CPU-only: return fallback data or null
        result = {
          success: true,
          data: taskRequest.metadata?.fallbackData || null,
          error: null,
          latency: Date.now() - startTime,
          confidence: routeDecision.route === 'cpu-fallback' ? 0.5 : 1.0,
          provider: 'cpu',
          providerUsed: 'cpu-fallback',
        };
        break;

      case 'local-gpu':
        // Route through local provider if registered in provider manager
        if (providerManager?.providers?.local) {
          const payload = {
            ...taskRequest,
            metadata: {
              ...taskRequest.metadata,
              preferredProvider: 'local',
            },
          };
          result = await providerManager.executeWithOrchestration(payload);
        } else {
          // Local provider not registered — fall back to remote
          diagnostic.reason += ' (local provider not registered, falling back to remote)';
          diagnostic.route = 'remote-provider';
          result = await providerManager.executeWithOrchestration(taskRequest);
        }
        break;

      case 'remote-provider':
        // Use existing provider manager as-is
        result = await providerManager.executeWithOrchestration(taskRequest);
        break;

      case 'browser-platform':
        // Browser-managed — shouldn't reach here, but handle gracefully
        result = {
          success: true,
          data: null,
          error: null,
          latency: 0,
          confidence: 1.0,
          provider: 'browser',
          providerUsed: 'browser-platform',
        };
        break;

      default:
        result = await providerManager.executeWithOrchestration(taskRequest);
    }

    diagnostic.latencyMs = Date.now() - startTime;
    diagnostic.providerUsed = result?.providerUsed || routeDecision.provider;
    diagnostic.success = result?.success ?? false;
    diagnostic.fromCache = result?.providerUsed === 'cache';

    // Log routing decision (dev-friendly, not noisy)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ComputeOrchestrator] ${taskRequest.taskType} → ${diagnostic.route} (${diagnostic.providerUsed || 'n/a'}, ${diagnostic.latencyMs}ms) — ${diagnostic.reason}`);
    }

    return {
      ...result,
      _routing: diagnostic,
    };
  } catch (error) {
    diagnostic.latencyMs = Date.now() - startTime;
    diagnostic.success = false;
    diagnostic.error = error.message;

    console.error(`[ComputeOrchestrator] Error routing ${taskRequest.taskType}: ${error.message}`);

    // Return fallback on error
    return {
      success: false,
      data: taskRequest.metadata?.fallbackData || null,
      error: error.message,
      latency: Date.now() - startTime,
      confidence: 0,
      provider: 'error',
      providerUsed: 'error-fallback',
      _routing: diagnostic,
    };
  }
}

/**
 * Get diagnostics for the last set of routing decisions.
 */
function getRoutingDiagnostics() {
  return {
    policy: _policy,
    localInferenceAvailable: isLocalInferenceAvailable(),
    availablePolicies: Object.keys(RESOURCE_POLICIES),
  };
}

module.exports = {
  orchestrateTask,
  decideRoute,
  setResourcePolicy,
  getResourcePolicy,
  getRoutingDiagnostics,
  RESOURCE_POLICIES,
};
